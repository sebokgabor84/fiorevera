// @vitest-environment node
/**
 * The content lane (scripts/release/publish-content.ts): the one script through which an agent may
 * put a change live. What is tested here is its refusal rules as pure functions; the git and GitHub
 * steps are not exercised by the unit suite (first real run: supervised pilot, docs/vera-agent/PRD.md §3.7).
 */
import { describe, expect, it } from 'vitest';
import { lastContentRelease, refusal, refusalBeforeApproval, type LaneFacts } from '../../scripts/release/publish-content';
import { excerpt } from '../../scripts/content/gates';
import { parseChanges, row } from '../../scripts/content/lib/changelog';

const pass = (name: string) => ({ name, status: 'pass' as const, seconds: 1, log: `.content/gates/${name}.log` });
const receipt = (overrides: Partial<NonNullable<LaneFacts['receipt']>> = {}): NonNullable<LaneFacts['receipt']> => ({
  ok: true,
  needsReview: true,
  fingerprint: 'abc',
  steps: ['lint', 'unit', 'build', 'layout', 'pictures', 'e2e'].map(pass),
  ...overrides,
});
const approved = { mayRecord: true, mayCommit: true, problems: [], issues: [] };
const facts = (overrides: Partial<LaneFacts> = {}): LaneFacts => ({
  branch: 'content/2027-01-10-arch-price',
  upToDate: true,
  classification: { class: 'content', reasons: [] },
  receipt: receipt(),
  fingerprint: 'abc',
  approvedBy: 'Vera',
  answers: approved,
  approvedInChat: '',
  what: 'A fa boldogságkapu ára 19 990 Ft → 21 990 Ft',
  ...overrides,
});

describe('content lane: what may go live on the owner\'s yes', () => {
  it('lets a reviewed, gated, pure content change through', () => {
    expect(refusal(facts())).toBeNull();
  });

  it('lets a change without any changed screen through on a recorded sentence from the chat', () => {
    expect(refusal(facts({ receipt: receipt({ needsReview: false }), answers: null, approvedInChat: 'Igen, mehet élesbe.' }))).toBeNull();
  });

  it.each([
    ['a branch that is not a content branch', { branch: 'feature/new-header' }, 'branch'],
    ['main itself', { branch: 'main' }, 'branch'],
    ['no description for the change log', { what: ' ' }, 'what-missing'],
    ['anything the classifier does not call content', { classification: { class: 'needs-gabor' as const, reasons: ['src/components/Home/HomeHero.tsx: not a content file'] } }, 'needs-gabor'],
    ['a branch that is behind main', { upToDate: false }, 'main-moved'],
    ['gates that never ran', { receipt: null }, 'gates-missing'],
    ['content changed after the gates ran', { fingerprint: 'def' }, 'gates-stale'],
    ['a red gate', { receipt: receipt({ ok: false, steps: [pass('lint'), { name: 'unit', status: 'fail' as const, seconds: 3, log: 'x' }] }) }, 'gates-red'],
    ['everything green but nobody typed their PIN', { approvedBy: '' }, 'approver-missing'],
    ['changed screens without the owner\'s answers', { answers: null }, 'answers-missing'],
    ['a chat sentence in place of the review page when screens changed', { answers: null, approvedInChat: 'mehet' }, 'answers-missing'],
    ['a screen marked as not right', { answers: { mayRecord: false, mayCommit: false, problems: [], issues: [{ id: 'rental-375', note: 'rossz ár' }] } }, 'review-issues'],
    ['answers for other pictures or an unanswered screen', { answers: { mayRecord: false, mayCommit: false, problems: ['home-375: not answered'], issues: [] } }, 'review-incomplete'],
    ['an approved look without "put it live"', { answers: { mayRecord: true, mayCommit: false, problems: [], issues: [] } }, 'not-go'],
    ['no screen changed and nothing recorded from the chat', { receipt: receipt({ needsReview: false }), answers: null }, 'approval-missing'],
  ] as [string, Partial<LaneFacts>, string][])('refuses %s', (_label, overrides, code) => {
    expect(refusal(facts(overrides))?.code).toBe(code);
  });

  it('the PIN is the LAST line: it is only asked for once everything else holds', () => {
    // before the approver is asked, a missing approver is not a reason …
    expect(refusalBeforeApproval(facts({ approvedBy: '' }))).toBeNull();
    // … and every other reason comes first, so nobody types a PIN for a change that cannot go live
    for (const broken of [{ branch: 'feature/x' }, { upToDate: false }, { fingerprint: 'def' }, { answers: null }] as Partial<LaneFacts>[]) {
      expect(refusal(facts({ ...broken, approvedBy: '' }))?.code).not.toBe('approver-missing');
      expect(refusalBeforeApproval(facts({ ...broken, approvedBy: '' }))).not.toBeNull();
    }
  });

  it('names the reasons when it sends a change to the technical owner', () => {
    const refused = refusal(facts({ classification: { class: 'needs-gabor', reasons: ['src/i18n/locales/hu.json: legal text "privacy.title" changed'] } }));
    expect(refused?.message).toContain('legal text "privacy.title" changed');
    expect(refused?.message).toContain('--handoff');
  });
});

describe('rollback: which release does "undo the last change" mean', () => {
  const log = (...subjects: string[]) => subjects.map((subject, i) => `${'abcdef0'.repeat(5)}${i}\t${subject}`).join('\n');

  it('the newest merge on main, when it is a content release', () => {
    expect(lastContentRelease(log('Merge pull request #31 from sebokgabor84/content/2027-01-10-arch-price', 'Merge pull request #30 from sebokgabor84/feature/header'))).toMatchObject({ branch: 'content/2027-01-10-arch-price', latest: true });
  });

  it('is flagged when other changes went live after it (needs the technical owner)', () => {
    expect(lastContentRelease(log('Merge pull request #32 from sebokgabor84/feature/header', 'Merge pull request #31 from sebokgabor84/content/2027-01-10-arch-price'))).toMatchObject({ latest: false });
  });

  it('never undoes an undo, and finds nothing when there is no content release', () => {
    expect(lastContentRelease(log('Merge pull request #33 from sebokgabor84/content/revert-2027-01-11-abcdef0', 'Merge pull request #31 from sebokgabor84/content/2027-01-10-arch-price'))).toBeNull();
    expect(lastContentRelease(log('Merge pull request #30 from sebokgabor84/feature/header', 'docs: something'))).toBeNull();
  });
});

describe('change log and gate excerpts', () => {
  it('a change log row survives being written and read back, pipes and line breaks included', () => {
    const entry = { date: '2027-01-10', what: 'Új album: Zsófi és Bence | Kehida Kapuja\nmásodik sor', approvedBy: 'Vera', state: 'megjelent' as const, branch: 'content/2027-01-10-zsofi-bence' };
    expect(parseChanges(row(entry))).toEqual([{ ...entry, what: 'Új album: Zsófi és Bence / Kehida Kapuja második sor' }]);
  });

  it('a gate excerpt is the last lines of the output without colour codes', () => {
    const output = `${Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n')}\n\u001b[31mFAIL\u001b[0m tests/unit/data.test.ts\n\n`;
    const text = excerpt(output, 3);
    expect(text.split('\n')).toEqual(['line 49', 'line 50', 'FAIL tests/unit/data.test.ts']);
  });
});
