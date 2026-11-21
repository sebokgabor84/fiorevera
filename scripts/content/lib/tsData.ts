/**
 * scripts/content/lib/tsData.ts — reads and rewrites the data literals in src/data/*.ts WITHOUT
 * executing them and without reformatting what was not changed.
 *
 * The content files are TypeScript modules that export plain literals (arrays of objects, one
 * object, a list of ids). An operation changes one element; everything else in the file — comments,
 * imports, other exports, the text of untouched elements — must stay byte for byte, so that a
 * content change shows up in git as exactly that change. The TypeScript parser gives the positions;
 * this module only cuts and pastes text between them.
 */
import ts from 'typescript';

export class DataFileError extends Error {}

const unwrap = (node: ts.Expression): ts.Expression => {
  let current = node;
  while (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
};

/** The value of a pure literal expression. Anything that is not data (a call, an identifier) is refused. */
export function literalValue(expression: ts.Expression): unknown {
  const node = unwrap(expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((element) => literalValue(element));
  if (ts.isObjectLiteralExpression(node)) {
    const out: Record<string, unknown> = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) throw new DataFileError(`only "key: value" properties are data (found ${ts.SyntaxKind[property.kind]})`);
      const name = property.name;
      if (!ts.isIdentifier(name) && !ts.isStringLiteral(name)) throw new DataFileError('only plain property names are data');
      out[name.text] = literalValue(property.initializer);
    }
    return out;
  }
  throw new DataFileError(`not a data literal: ${ts.SyntaxKind[node.kind]}`);
}

const parse = (source: string): ts.SourceFile => ts.createSourceFile('data.ts', source, ts.ScriptTarget.ES2023, true, ts.ScriptKind.TS);

/** The initializer of `export const <name> = …` (type assertions such as `as const` stripped). */
function exportInitializer(source: string, name: string): { file: ts.SourceFile; node: ts.Expression } {
  const file = parse(source);
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) {
        return { file, node: unwrap(declaration.initializer) };
      }
    }
  }
  throw new DataFileError(`export "${name}" not found`);
}

export interface LiteralElement {
  /** The element exactly as written in the file. */
  text: string;
  value: unknown;
}

/** An exported array literal as its elements, each with its original text. */
export function readArray(source: string, name: string): LiteralElement[] {
  const { file, node } = exportInitializer(source, name);
  if (!ts.isArrayLiteralExpression(node)) throw new DataFileError(`export "${name}" is not an array literal`);
  return node.elements.map((element) => ({ text: element.getText(file), value: literalValue(element) }));
}

/** An exported object (or any other) literal as a value. */
export function readValue(source: string, name: string): unknown {
  return literalValue(exportInitializer(source, name).node);
}

/** Replaces the text of an exported literal, leaving the rest of the file untouched. */
export function replaceLiteral(source: string, name: string, text: string): string {
  const { file, node } = exportInitializer(source, name);
  return source.slice(0, node.getStart(file)) + text + source.slice(node.getEnd());
}

// ── Writing literals in the repository's style ────────────────────────────────────────────────

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const quote = (s: string): string => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
const key = (k: string): string => (IDENTIFIER.test(k) ? k : quote(k));

/** `{ id: 'x', partners: ['A', 'B'] }` — everything on one line. */
export function inlineLiteral(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return quote(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(inlineLiteral).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    return entries.length ? `{ ${entries.map(([k, v]) => `${key(k)}: ${inlineLiteral(v)}`).join(', ')} }` : '{}';
  }
  throw new DataFileError(`cannot write a ${typeof value} as data`);
}

/** An object with one property per line (nested values inline), closing brace at `indent`. */
export function blockLiteral(value: Record<string, unknown>, indent: number): string {
  const pad = ' '.repeat(indent + 2);
  const lines = Object.entries(value)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${pad}${key(k)}: ${inlineLiteral(v)},`);
  return `{\n${lines.join('\n')}\n${' '.repeat(indent)}}`;
}

/** Longest line the data files use for a one-line element; longer elements are written as a block. */
export const INLINE_WIDTH = 160;

/** An array element in the file's own style: one line when it fits, a block otherwise. */
export function elementLiteral(value: unknown, indent = 2): string {
  const inline = inlineLiteral(value);
  if (indent + inline.length + 1 <= INLINE_WIDTH || value === null || typeof value !== 'object' || Array.isArray(value)) return inline;
  return blockLiteral(value as Record<string, unknown>, indent);
}

/**
 * Rewrites an exported array of objects from values. An element whose value did not change keeps its
 * original text; a new or changed element is written in the file's own style (a block when every
 * existing element is a block, otherwise one line when it fits).
 */
export function writeArray(source: string, name: string, values: readonly unknown[], indent = 2): string {
  const original = readArray(source, name);
  const byValue = new Map(original.map((element) => [JSON.stringify(element.value), element.text]));
  const allBlock = original.length > 0 && original.every((element) => element.text.includes('\n'));
  const texts = values.map((value) => {
    const kept = byValue.get(JSON.stringify(value));
    if (kept !== undefined) return kept;
    if (allBlock && value !== null && typeof value === 'object' && !Array.isArray(value)) return blockLiteral(value as Record<string, unknown>, indent);
    return elementLiteral(value, indent);
  });
  const pad = ' '.repeat(indent);
  const body = texts.length ? `[\n${texts.map((text) => `${pad}${text},`).join('\n')}\n${' '.repeat(indent - 2)}]` : '[]';
  return replaceLiteral(source, name, body);
}
