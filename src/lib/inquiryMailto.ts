/**
 * Fallback for a failed provider submission (PRD D-9): a `mailto:` URL that carries the typed
 * inquiry, so the visitor can finish in their own mail app without retyping anything.
 * Pure and deterministic — safe in render paths (PRD D-18).
 */
export interface MailtoLine {
  label: string;
  value: string;
}

/** Mail clients expect CRLF line breaks in a mailto body (RFC 6068). */
const CRLF = '\r\n';

export const buildMailto = (to: string, subject: string, lines: MailtoLine[]): string => {
  const body = lines
    .map((line) => ({ label: line.label, value: line.value.trim() }))
    .filter((line) => line.value)
    .map((line) => `${line.label}: ${line.value}`)
    .join(CRLF);
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
