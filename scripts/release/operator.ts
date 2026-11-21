/**
 * scripts/release/operator.ts — which human is approving? (owner decision 2026-11-21, docs/decisions/0005)
 *
 *   npm run release:operator                          who is set up on this machine (no secrets shown)
 *   npm run release:operator -- --verify [--as gabor] ask for that person's PIN; says who it is and their role
 *   npm run release:operator -- --set vera --role content --name "Vera"     create or change a person (asks for the new PIN twice)
 *   npm run release:operator -- --default vera        who normally sits at this machine
 *
 * The Claude account and the GitHub user are shared, so neither says who is at the keyboard. This
 * does: every person has a PIN that they chose themselves (four digits or more, like a phone PIN),
 * and the scripts that put something live ask for it in a macOS dialog. The PIN never passes
 * through the chat or an agent: the dialog hands it to this process, which compares it with a
 * salted scrypt hash and forgets it. Three wrong entries lock that person for five minutes.
 *
 * Two moments (owner decision 2026-11-21):
 *   start of the day   the agent asks who is at the keyboard and runs `npm run content:morning -- --as <id>`.
 *                      An admin proves it with the PIN right away (admin mode unlocks framework work);
 *                      a content person is taken at their word, because …
 *   the last line      … nothing goes live without the approver's PIN, asked by the release script
 *                      after every automated check has passed and immediately before the merge.
 *
 *   role content  may approve content releases, rollbacks and drops (Vera)
 *   role admin    the same, plus: identifies the technical owner to the agent for framework work on
 *                 any machine, and is needed to create or change a person (Gabor)
 *
 * The people of a machine live OUTSIDE the repository, in ~/.config/fiorevera/operators.json
 * (mode 600). The default person of a machine is `FV_OPERATOR` (for example in the git-ignored
 * .claude/settings.local.json) or the file's `default`; it only chooses whose PIN is asked for.
 *
 * What this is not: it proves knowledge of a PIN to a script on the same machine as the agent. A
 * phone PIN is safe because the phone's chip limits the tries; here the hash and the lock are in a
 * file. So it tells the two owners apart and stops a mistaken or misattributed approval; it is not
 * a wall against an agent that deliberately guesses or avoids the release scripts altogether. That
 * wall is on GitHub (ruleset today, separate accounts later: BACKLOG.md).
 */
import { spawnSync } from 'node:child_process';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type Role = 'content' | 'admin';
export interface Operator {
  /** How the person is named in the change log and in commit messages. */
  name: string;
  role: Role;
  salt: string;
  hash: string;
  /** Wrong entries in a row, and until when (ISO time) the person is locked after three of them. */
  failed?: number;
  lockedUntil?: string;
}
export interface OperatorsFile {
  default?: string;
  operators: Record<string, Operator>;
}
export interface Verified {
  id: string;
  name: string;
  role: Role;
}

export class OperatorError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const MIN_PIN_LENGTH = 4;
export const MAX_TRIES = 3;
export const LOCK_MINUTES = 5;
/** scrypt cost: about a third of a second per check. It slows guessing down; with four digits it cannot prevent it. */
const SCRYPT = { N: 2 ** 16, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const ID = /^[a-z][a-z0-9-]{1,30}$/;

export const operatorsPath = (): string => process.env.FV_OPERATORS_FILE ?? path.join(os.homedir(), '.config', 'fiorevera', 'operators.json');

export const hashPin = (password: string, salt: string): string => scryptSync(password.normalize('NFC'), Buffer.from(salt, 'hex'), 32, SCRYPT).toString('hex');

export function checkPin(operator: Operator, pin: string): boolean {
  const expected = Buffer.from(operator.hash, 'hex');
  const given = Buffer.from(hashPin(pin, operator.salt), 'hex');
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function loadOperators(file = operatorsPath()): OperatorsFile {
  if (!existsSync(file)) return { operators: {} };
  const data = JSON.parse(readFileSync(file, 'utf8')) as OperatorsFile;
  return { default: data.default, operators: data.operators ?? {} };
}

export function saveOperators(data: OperatorsFile, file = operatorsPath()): void {
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  chmodSync(file, 0o600);
}

// ── Who is at the keyboard today ──────────────────────────────────────────────────────────────

export interface DaySession {
  /** YYYY-MM-DD, local time: a session is valid for the day it was started on. */
  day: string;
  operator: string;
  name: string;
  role: Role;
  /** true when the PIN was checked at the start of the day (always for an admin). */
  verified: boolean;
}

export const sessionPath = (): string => process.env.FV_SESSION_FILE ?? path.join(path.dirname(operatorsPath()), 'session.json');
export const localDay = (date: Date = new Date()): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Today's session on this machine, or null when nobody has said who they are yet today. */
export function todaySession(now: Date = new Date(), file = sessionPath()): DaySession | null {
  if (!existsSync(file)) return null;
  try {
    const session = JSON.parse(readFileSync(file, 'utf8')) as DaySession;
    return session.day === localDay(now) ? session : null;
  } catch {
    return null;
  }
}

/**
 * Start of the day: records who is at the keyboard. An admin must prove it with the PIN now; a
 * content person is recorded as stated (their PIN is the last line before anything goes live).
 */
export function startDay(id: string | undefined, options: { ask?: Ask; file?: string; sessionFile?: string; env?: NodeJS.ProcessEnv; now?: () => Date } = {}): DaySession {
  const data = loadOperators(options.file);
  const chosen = chooseOperator(data, id, options.env, null);
  const operator = data.operators[chosen];
  const verified = operator.role === 'admin';
  if (verified) verifyOperator('Jó reggelt! Azonosítás a mai munkához (admin).', { as: chosen, need: 'admin', ask: options.ask, file: options.file, now: options.now });
  const session: DaySession = { day: localDay(options.now?.() ?? new Date()), operator: chosen, name: operator.name, role: operator.role, verified };
  const file = options.sessionFile ?? sessionPath();
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  writeFileSync(file, `${JSON.stringify(session, null, 2)}\n`, { mode: 0o600 });
  return session;
}

/** Whose PIN is asked for: the named person, else whoever started today, else FV_OPERATOR, else the file's default, else the only person. */
export function chooseOperator(data: OperatorsFile, wanted?: string, env: NodeJS.ProcessEnv = process.env, session: DaySession | null = todaySession()): string {
  const ids = Object.keys(data.operators);
  if (ids.length === 0) {
    throw new OperatorError('no-operators', 'nobody is set up on this machine yet. The technical owner runs once: npm run release:operator -- --set <id> --role admin --name "<name>"');
  }
  const id = wanted || session?.operator || env.FV_OPERATOR || data.default || (ids.length === 1 ? ids[0] : '');
  if (!id) throw new OperatorError('operator-unclear', `several people are set up (${ids.join(', ')}) and no default: say who is approving (--as <id>) or set one: npm run release:operator -- --default <id>`);
  if (!data.operators[id]) throw new OperatorError('operator-unknown', `"${id}" is not set up on this machine (known: ${ids.join(', ')})`);
  return id;
}

/** How a PIN is obtained. The real one is a macOS dialog; tests pass their own. */
export type Ask = (prompt: { title: string; message: string }) => string | null;

/** The AppleScript of the PIN dialog: hidden input, 15 minutes to answer, title and message as arguments. */
export const DIALOG_SCRIPT = [
  'on run argv',
  '  try',
  '    set answer to display dialog (item 2 of argv) with title (item 1 of argv) default answer "" with hidden answer buttons {"Mégse", "OK"} default button "OK" cancel button "Mégse" giving up after 900',
  '    if gave up of answer then return "GAVE-UP"',
  '    return "OK:" & text returned of answer',
  '  on error number -128',
  '    return "CANCELLED"',
  '  end try',
  'end run',
].join('\n');

/** A hidden-input dialog on macOS. Returns null when it was cancelled or nobody answered in time. */
export const dialog: Ask = ({ title, message }) => {
  if (process.platform !== 'darwin') throw new OperatorError('dialog-unavailable', 'the PIN dialog needs macOS; approvals are given on a Mac');
  const script = DIALOG_SCRIPT;
  const result = spawnSync('/usr/bin/osascript', ['-e', script, title, message], { encoding: 'utf8' });
  const out = (result.stdout ?? '').replace(/\r?\n$/, '');
  return result.status === 0 && out.startsWith('OK:') ? out.slice(3) : null;
};

/**
 * Asks the chosen person for their PIN and returns who they are. `purpose` is shown in the dialog,
 * so nobody types a PIN without reading what it approves. Three wrong entries in a row (also across
 * calls) lock that person for five minutes.
 */
export function verifyOperator(purpose: string, options: { as?: string; need?: Role; ask?: Ask; file?: string; env?: NodeJS.ProcessEnv; now?: () => Date } = {}): Verified {
  const now = options.now ?? (() => new Date());
  const data = loadOperators(options.file);
  const id = chooseOperator(data, options.as, options.env);
  const operator = data.operators[id];
  if (options.need === 'admin' && operator.role !== 'admin') {
    throw new OperatorError('admin-needed', `this needs the technical owner; "${id}" may approve content only. An admin approves with --as <their id>`);
  }
  if (operator.lockedUntil && new Date(operator.lockedUntil) > now()) {
    throw new OperatorError('locked', `${operator.name} is locked until ${operator.lockedUntil} after ${MAX_TRIES} wrong PIN entries: nothing was approved`);
  }
  const ask = options.ask ?? dialog;
  const remember = (failed: number, lockedUntil?: string): void => {
    data.operators[id] = { ...operator, failed, lockedUntil };
    if (!lockedUntil) delete data.operators[id].lockedUntil;
    saveOperators(data, options.file);
  };
  let failed = operator.lockedUntil ? 0 : (operator.failed ?? 0);
  while (failed < MAX_TRIES) {
    const pin = ask({ title: 'Fiore Vera', message: `${purpose}\n\n${operator.name} PIN-kódja${failed > 0 ? ' (nem egyezett, próbáld újra)' : ''}:` });
    if (pin === null) throw new OperatorError('approval-cancelled', 'the PIN dialog was cancelled or nobody answered: nothing was approved');
    if (checkPin(operator, pin)) {
      if (operator.failed || operator.lockedUntil) remember(0);
      return { id, name: operator.name, role: operator.role };
    }
    failed += 1;
    remember(failed);
  }
  remember(0, new Date(now().getTime() + LOCK_MINUTES * 60_000).toISOString());
  throw new OperatorError('pin-wrong', `the PIN for ${operator.name} was wrong ${MAX_TRIES} times: nothing was approved, and ${operator.name} is locked for ${LOCK_MINUTES} minutes`);
}

/**
 * Creates or changes a person, who chooses their own PIN in the dialog. The first person of a
 * machine must be an admin; after that every change needs an admin's PIN first.
 */
export function setOperator(id: string, role: Role, name: string, options: { ask?: Ask; file?: string } = {}): Verified {
  if (!ID.test(id)) throw new OperatorError('id-invalid', `"${id}" is not a usable id (lower-case letters, digits and hyphens, for example "vera")`);
  if (role !== 'content' && role !== 'admin') throw new OperatorError('role-invalid', 'the role is content or admin');
  if (!name.trim()) throw new OperatorError('name-missing', 'the person needs a name for the change log (--name "Vera")');
  const data = loadOperators(options.file);
  const ask = options.ask ?? dialog;
  const admins = Object.entries(data.operators).filter(([, operator]) => operator.role === 'admin');
  if (admins.length === 0 && role !== 'admin') throw new OperatorError('admin-first', 'the first person on a machine must be the technical owner (--role admin)');
  if (admins.length > 0) {
    const admin = data.default && data.operators[data.default]?.role === 'admin' ? data.default : admins[0][0];
    verifyOperator(`Új vagy módosított jóváhagyó: ${name} (${role}).`, { as: admin, need: 'admin', ask, file: options.file });
  }
  const first = ask({ title: 'Fiore Vera', message: `${name} új PIN-kódja (legalább ${MIN_PIN_LENGTH} számjegy):` });
  if (first === null) throw new OperatorError('approval-cancelled', 'cancelled: nothing was changed');
  if (first.length < MIN_PIN_LENGTH) throw new OperatorError('pin-short', `the PIN needs at least ${MIN_PIN_LENGTH} digits: nothing was changed`);
  const second = ask({ title: 'Fiore Vera', message: `${name} új PIN-kódja még egyszer:` });
  if (second !== first) throw new OperatorError('pin-mismatch', 'the two entries were not the same: nothing was changed');
  const salt = randomBytes(16).toString('hex');
  // Re-read: the admin check above may have written its own attempt counter.
  const fresh = loadOperators(options.file);
  data.operators = fresh.operators;
  data.default = fresh.default;
  data.operators[id] = { name: name.trim(), role, salt, hash: hashPin(first, salt) };
  if (!data.default) data.default = id;
  saveOperators(data, options.file);
  return { id, name: name.trim(), role };
}

/** Who is set up, without anything secret. */
export const describeOperators = (data: OperatorsFile, env: NodeJS.ProcessEnv = process.env): { default: string | null; people: { id: string; name: string; role: Role }[] } => ({
  default: env.FV_OPERATOR || data.default || null,
  people: Object.entries(data.operators).map(([id, operator]) => ({ id, name: operator.name, role: operator.role })),
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const value = (name: string): string => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '';
  };
  try {
    let answer: Record<string, unknown>;
    if (argv.includes('--set')) answer = { ok: true, set: setOperator(value('set'), value('role') as Role, value('name') || value('set')) };
    else if (argv.includes('--default')) {
      const data = loadOperators();
      const id = chooseOperator(data, value('default'));
      verifyOperator(`A gép alapértelmezett jóváhagyója: ${data.operators[id].name}.`, { need: 'admin', as: Object.entries(data.operators).find(([, o]) => o.role === 'admin')?.[0] });
      saveOperators({ ...data, default: id });
      answer = { ok: true, default: id };
    } else if (argv.includes('--verify')) answer = { ok: true, verified: verifyOperator('Azonosítás a munkamenethez.', { as: value('as') || undefined }) };
    else answer = { ok: true, file: operatorsPath(), ...describeOperators(loadOperators()), today: todaySession() };
    console.log(JSON.stringify(answer, null, 2));
  } catch (error) {
    const refused = error instanceof OperatorError ? { code: error.code, message: error.message } : { code: 'unexpected', message: error instanceof Error ? error.message : String(error) };
    console.log(JSON.stringify({ ok: false, ...refused }, null, 2));
    process.exitCode = 1;
  }
}
