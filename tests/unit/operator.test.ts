// @vitest-environment node
/**
 * Who is approving? (scripts/release/operator.ts, docs/decisions/0005-who-is-at-the-keyboard.md)
 * The PIN dialog itself needs a person; everything around it is tested here with a stand-in for the
 * dialog: hashing, the three-tries lock, roles, who is asked, the start-of-day session.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  DIALOG_SCRIPT,
  LOCK_MINUTES,
  OperatorError,
  checkPin,
  chooseOperator,
  describeOperators,
  hashPin,
  loadOperators,
  localDay,
  setOperator,
  startDay,
  todaySession,
  verifyOperator,
  type Ask,
  type OperatorsFile,
} from '../../scripts/release/operator';

const dir = mkdtempSync(path.join(os.tmpdir(), 'fv-operators-'));
const file = path.join(dir, 'operators.json');
const sessionFile = path.join(dir, 'session.json');
afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** A stand-in for the dialog: answers in order, records what was shown. */
const answers = (...pins: (string | null)[]): Ask & { shown: string[] } => {
  const shown: string[] = [];
  const ask = (({ message }) => {
    shown.push(message);
    return pins.length ? pins.shift()! : null;
  }) as Ask & { shown: string[] };
  ask.shown = shown;
  return ask;
};
const code = (fn: () => unknown): string => {
  try {
    fn();
  } catch (error) {
    if (error instanceof OperatorError) return error.code;
    throw error;
  }
  return 'NOT REFUSED';
};

beforeAll(() => {
  // The technical owner first (no admin exists yet), then Vera, which needs his PIN.
  expect(code(() => setOperator('vera', 'content', 'Vera', { ask: answers('1234', '1234'), file }))).toBe('admin-first');
  expect(setOperator('gabor', 'admin', 'Gábor', { ask: answers('8642', '8642'), file })).toEqual({ id: 'gabor', name: 'Gábor', role: 'admin' });
  expect(setOperator('vera', 'content', 'Vera', { ask: answers('8642', '1357', '1357'), file })).toEqual({ id: 'vera', name: 'Vera', role: 'content' });
});

describe('people of a machine', () => {
  it('are stored outside the repository, readable by the owner only, without the PIN', () => {
    expect(statSync(file).mode & 0o777).toBe(0o600);
    const text = readFileSync(file, 'utf8');
    expect(text).not.toContain('8642');
    expect(text).not.toContain('1357');
    const data = loadOperators(file);
    expect(describeOperators(data, {})).toEqual({ default: 'gabor', people: [{ id: 'gabor', name: 'Gábor', role: 'admin' }, { id: 'vera', name: 'Vera', role: 'content' }] });
    expect(checkPin(data.operators.vera, '1357')).toBe(true);
    expect(checkPin(data.operators.vera, '1358')).toBe(false);
    expect(hashPin('1357', data.operators.vera.salt)).not.toBe(hashPin('1357', data.operators.gabor.salt));
  });

  it('a four-digit PIN is accepted, a shorter one or two different entries are not', () => {
    expect(code(() => setOperator('guest', 'content', 'Vendég', { ask: answers('8642', '123', '123'), file }))).toBe('pin-short');
    expect(code(() => setOperator('guest', 'content', 'Vendég', { ask: answers('8642', '1234', '1235'), file }))).toBe('pin-mismatch');
    expect(code(() => setOperator('guest', 'content', 'Vendég', { ask: answers('0000', '0000', '0000'), file }))).toBe('pin-wrong'); // not the admin's PIN
    expect(code(() => setOperator('Bad Id', 'content', 'X', { ask: answers(), file }))).toBe('id-invalid');
    expect(Object.keys(loadOperators(file).operators)).toEqual(['gabor', 'vera']);
    // undo the lock the wrong admin PIN above has set, so the tests below start clean
    verifyOperator('reset', { as: 'gabor', ask: answers('8642'), file, now: () => new Date(Date.now() + (LOCK_MINUTES + 1) * 60_000) });
  });

  it('who is asked: the named person, else today\'s person, else FV_OPERATOR, else the default', () => {
    const data = loadOperators(file);
    const session = { day: localDay(), operator: 'vera', name: 'Vera', role: 'content' as const, verified: false };
    expect(chooseOperator(data, 'gabor', { FV_OPERATOR: 'vera' }, session)).toBe('gabor');
    expect(chooseOperator(data, undefined, { FV_OPERATOR: 'gabor' }, session)).toBe('vera');
    expect(chooseOperator(data, undefined, { FV_OPERATOR: 'vera' }, null)).toBe('vera');
    expect(chooseOperator(data, undefined, {}, null)).toBe('gabor');
    expect(code(() => chooseOperator(data, 'nobody', {}, null))).toBe('operator-unknown');
    expect(code(() => chooseOperator({ operators: {} } as OperatorsFile, undefined, {}, null))).toBe('no-operators');
    const noDefault = { operators: data.operators };
    expect(code(() => chooseOperator(noDefault, undefined, {}, null))).toBe('operator-unclear');
  });
});

describe('the PIN check (the last line before anything goes live)', () => {
  it('names what is being approved and whose PIN it wants', () => {
    const ask = answers('1357');
    expect(verifyOperator('Élesítés: új ár', { as: 'vera', ask, file })).toEqual({ id: 'vera', name: 'Vera', role: 'content' });
    expect(ask.shown[0]).toContain('Élesítés: új ár');
    expect(ask.shown[0]).toContain('Vera PIN-kódja');
  });

  it('a cancelled dialog approves nothing', () => {
    expect(code(() => verifyOperator('x', { as: 'vera', ask: answers(null), file }))).toBe('approval-cancelled');
  });

  it('a content person cannot pass where the technical owner is needed', () => {
    expect(code(() => verifyOperator('x', { as: 'vera', need: 'admin', ask: answers('1357'), file }))).toBe('admin-needed');
    expect(verifyOperator('x', { as: 'gabor', need: 'admin', ask: answers('8642'), file }).role).toBe('admin');
  });

  it('three wrong entries lock the person for five minutes, also across calls; the right PIN clears the count', () => {
    const t0 = new Date('2027-01-10T08:00:00');
    // two wrong entries in one call, cancelled; the count is remembered
    expect(code(() => verifyOperator('x', { as: 'vera', ask: answers('0000', '1111', null), file, now: () => t0 }))).toBe('approval-cancelled');
    expect(loadOperators(file).operators.vera.failed).toBe(2);
    // the third wrong entry, in another call, locks
    const ask = answers('2222', '1357');
    expect(code(() => verifyOperator('x', { as: 'vera', ask, file, now: () => t0 }))).toBe('pin-wrong');
    expect(ask.shown).toHaveLength(1);
    // locked: even the right PIN is not asked for
    const locked = answers('1357');
    expect(code(() => verifyOperator('x', { as: 'vera', ask: locked, file, now: () => new Date(t0.getTime() + 60_000) }))).toBe('locked');
    expect(locked.shown).toHaveLength(0);
    // Gabor is not affected by Vera's lock
    expect(verifyOperator('x', { as: 'gabor', ask: answers('8642'), file, now: () => t0 }).id).toBe('gabor');
    // after the lock the right PIN works and the count is gone
    const later = () => new Date(t0.getTime() + (LOCK_MINUTES + 1) * 60_000);
    expect(verifyOperator('x', { as: 'vera', ask: answers('1357'), file, now: later }).id).toBe('vera');
    expect(loadOperators(file).operators.vera.failed).toBe(0);
    expect(loadOperators(file).operators.vera.lockedUntil).toBeUndefined();
  });
});

describe('start of the day: who is at the keyboard', () => {
  const morning = new Date('2027-01-10T08:00:00');

  it('Vera is taken at her word (her PIN is the last line before a release)', () => {
    const ask = answers();
    const session = startDay('vera', { ask, file, sessionFile, now: () => morning });
    expect(session).toEqual({ day: '2027-01-10', operator: 'vera', name: 'Vera', role: 'content', verified: false });
    expect(ask.shown).toHaveLength(0);
    expect(todaySession(morning, sessionFile)).toEqual(session);
  });

  it('Gabor proves it with his PIN right away: admin mode unlocks framework work', () => {
    expect(code(() => startDay('gabor', { ask: answers(null), file, sessionFile, now: () => morning }))).toBe('approval-cancelled');
    expect(todaySession(morning, sessionFile)?.operator).toBe('vera'); // a failed claim changes nothing
    const session = startDay('gabor', { ask: answers('8642'), file, sessionFile, now: () => morning });
    expect(session).toMatchObject({ operator: 'gabor', role: 'admin', verified: true });
  });

  it('a session is good for its day only: the next morning the question is asked again', () => {
    expect(todaySession(new Date('2027-01-11T07:00:00'), sessionFile)).toBeNull();
    expect(todaySession(new Date('2027-01-10T23:59:00'), sessionFile)?.operator).toBe('gabor');
  });
});

describe('the dialog itself', () => {
  it.runIf(process.platform === 'darwin')('is valid AppleScript (compiled, not shown)', () => {
    const out = path.join(dir, 'dialog.scpt');
    const result = spawnSync('/usr/bin/osacompile', ['-e', DIALOG_SCRIPT, '-o', out], { encoding: 'utf8' });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('hides the input and gives up by itself', () => {
    expect(DIALOG_SCRIPT).toContain('with hidden answer');
    expect(DIALOG_SCRIPT).toContain('giving up after 900');
  });
});

describe('the good-morning routine (scripts/content/morning.ts)', () => {
  it('reports who is here, the mode, unfinished work and what waits for the technical owner — and changes nothing', async () => {
    const { execFileSync } = await import('node:child_process');
    const { cpSync, mkdirSync, writeFileSync } = await import('node:fs');
    const { morning, handoverAge } = await import('../../scripts/content/morning');
    const { recordChange } = await import('../../scripts/content/lib/changelog');
    const { FILES } = await import('../../scripts/content/lib/state');
    const REPO = path.resolve(__dirname, '../..');
    const root = mkdtempSync(path.join(os.tmpdir(), 'fv-morning-'));
    const sh = (...args: string[]): string => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, FV_SKIP_HOOKS: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' } });
    const commit = (message: string): string => sh('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '--allow-empty', '-am', message);
    for (const rel of [FILES.albums, FILES.rental, FILES.testimonials, FILES.contact, FILES.areas, FILES.images, FILES.locale('hu'), FILES.locale('de'), FILES.locale('en'), '.gitignore']) {
      mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      cpSync(path.join(REPO, rel), path.join(root, rel));
    }
    mkdirSync(path.join(root, '.agent'), { recursive: true });
    writeFileSync(path.join(root, '.agent/last-session-handover.md'), '# Handover\n');
    sh('init', '-q', '-b', 'main');
    sh('add', '-A');
    commit('base with the handover note');
    sh('update-ref', 'refs/remotes/origin/main', 'HEAD');

    process.env.FV_OPERATORS_FILE = file;
    const vera = { day: localDay(), operator: 'vera', name: 'Vera', role: 'content' as const, verified: false };
    const gabor = { day: localDay(), operator: 'gabor', name: 'Gábor', role: 'admin' as const, verified: true };
    try {
      // a clean main, nothing open
      const calm = morning(root, vera, { offline: true });
      expect(calm).toMatchObject({ ok: true, who: vera, site: 'not-checked', checkout: { branch: 'main', clean: true, behindMain: 0 }, waitingForGabor: [] });
      expect(calm.mode).toMatch(/^content/);
      expect(calm.handover).toMatchObject({ commitsSince: 0, freshness: 'fresh' });
      expect(calm.attention.filter((line) => /unfinished|wait for the technical owner|handover/.test(line))).toEqual([]);

      // an unfinished content change and something waiting for Gabor
      sh('switch', '-q', '-c', 'content/2027-01-10-arch-price');
      writeFileSync(path.join(root, FILES.rental), readFileSync(path.join(root, FILES.rental), 'utf8').replace('priceHuf: 19990', 'priceHuf: 21990'));
      recordChange(root, { date: '2027-01-09', what: 'Nagyobb logó a fejlécben', approvedBy: '—', state: 'Gáborra vár', branch: 'content/2027-01-09-logo' });
      const busy = morning(root, vera, { offline: true });
      expect(busy.checkout).toMatchObject({ branch: 'content/2027-01-10-arch-price', clean: false });
      expect(busy.attention.join('\n')).toMatch(/an unfinished content change is open on "content\/2027-01-10-arch-price"/);
      expect(busy.attention.join('\n')).toMatch(/1 change\(s\) wait for the technical owner: Nagyobb logó a fejlécben/);
      expect(busy.waitingForGabor).toHaveLength(1);
      expect(readFileSync(path.join(root, FILES.rental), 'utf8')).toContain('priceHuf: 21990'); // the routine touched nothing

      // an old handover note is flagged for the admin, as a claim to verify
      sh('switch', '-q', 'main', '--discard-changes');
      for (let i = 0; i < 11; i++) commit(`work ${i}`);
      sh('update-ref', 'refs/remotes/origin/main', 'HEAD');
      expect(handoverAge(root, new Date())).toMatchObject({ commitsSince: 11, freshness: 'stale' });
      const admin = morning(root, gabor, { offline: true });
      expect(admin.mode).toMatch(/^admin/);
      expect(admin.attention.join('\n')).toMatch(/the handover note is stale \(11 commit\(s\)/);
      expect(morning(root, vera, { offline: true }).attention.join('\n')).not.toMatch(/handover/); // not Vera's concern
    } finally {
      delete process.env.FV_OPERATORS_FILE;
      rmSync(root, { recursive: true, force: true });
    }
  });
});
