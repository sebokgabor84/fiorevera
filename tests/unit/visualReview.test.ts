import { describe, it, expect } from 'vitest';
import { CLOSING, UI, buildFingerprint, closingFor, judgeAnswers, parseAnswers, renderPage, type ReviewData } from '../../scripts/visual-review-page';

const review: ReviewData = {
  title: 'Site polish',
  round: 3,
  branch: 'feature/x',
  build: 'abc123def456',
  intro: 'Look at these.',
  screens: [
    { id: 'home-375', width: 375, height: 1500, notes: ['Hero buttons stacked'] },
    { id: 'rental-1280', width: 1280, height: 1500, notes: [] },
  ],
  approved: ['privacy-1280'],
  decisions: [{ id: 'D1', title: 'Hero buttons', options: [{ id: 'A', label: 'Keep', images: [] }, { id: 'B', label: 'Stack', images: [], recommended: true }] }],
  ownerSteps: [],
};

const pasted = (screens: string, questions: string, build = review.build) =>
  ['VISUAL REVIEW — Site polish — round 3', 'Branch: feature/x', `Build: ${build}`, '', 'Screens:', screens, '', 'Questions:', questions].join('\n');

describe('visual review answers (docs/qa/visual-review-process.md)', () => {
  it('reads verdicts, notes and the build from the copied text', () => {
    const a = parseAnswers(pasted('  home-375: OK\n  rental-1280: Issue — the previous version was better', '  D1 (Hero buttons): B\n  BASELINES (Re-record the visual baselines under your name): YES\n  COMMIT (Commit and push this branch): WAIT — one revert first'));
    expect(a.build).toBe('abc123def456');
    expect(a.screens).toEqual({ 'home-375': { verdict: 'OK', note: '' }, 'rental-1280': { verdict: 'Issue', note: 'the previous version was better' } });
    expect(a.questions.D1).toEqual({ answer: 'B', note: '' });
    expect(a.questions.COMMIT).toEqual({ answer: 'WAIT', note: 'one revert first' });
  });

  it('survives chat quoting and treats "NOT ANSWERED" as no answer', () => {
    const a = parseAnswers(pasted('> home-375: OK\n>   rental-1280: — NOT ANSWERED', '  BASELINES (x): — NOT ANSWERED'));
    expect(a.screens['home-375'].verdict).toBe('OK');
    expect(a.screens['rental-1280'].verdict).toBeNull();
    expect(a.questions.BASELINES.answer).toBeNull();
  });

  it('allows the re-record only when every screen is OK, BASELINES is YES and the build matches', () => {
    const ok = judgeAnswers(parseAnswers(pasted('  home-375: OK\n  rental-1280: OK', '  BASELINES (x): YES\n  COMMIT (x): GO')), review);
    expect(ok).toMatchObject({ mayRecord: true, mayCommit: true, problems: [], issues: [] });

    const wait = judgeAnswers(parseAnswers(pasted('  home-375: OK\n  rental-1280: OK', '  BASELINES (x): YES\n  COMMIT (x): WAIT')), review);
    expect(wait).toMatchObject({ mayRecord: true, mayCommit: false });

    const issue = judgeAnswers(parseAnswers(pasted('  home-375: OK\n  rental-1280: Issue — worse', '  BASELINES (x): YES\n  COMMIT (x): GO')), review);
    expect(issue.mayRecord).toBe(false);
    expect(issue.mayCommit).toBe(false);
    expect(issue.issues).toEqual([{ id: 'rental-1280', note: 'worse' }]);

    const unanswered = judgeAnswers(parseAnswers(pasted('  home-375: OK', '  BASELINES (x): YES\n  COMMIT (x): GO')), review);
    expect(unanswered.mayRecord).toBe(false);
    expect(unanswered.problems).toContain('rental-1280: not answered');

    const no = judgeAnswers(parseAnswers(pasted('  home-375: OK\n  rental-1280: OK', '  BASELINES (x): NO\n  COMMIT (x): GO')), review);
    expect(no.mayRecord).toBe(false);

    const stale = judgeAnswers(parseAnswers(pasted('  home-375: OK\n  rental-1280: OK', '  BASELINES (x): YES\n  COMMIT (x): GO', '000000000000')), review);
    expect(stale.mayRecord).toBe(false);
    expect(stale.problems[0]).toMatch(/are for build 000000000000/);
  });

  it('refuses answers without a build line (a hand-typed "all OK" is not an approval of these pixels)', () => {
    const v = judgeAnswers(parseAnswers('Screens:\n  home-375: OK\n  rental-1280: OK\nQuestions:\n  BASELINES: YES\n  COMMIT: GO'), review);
    expect(v.mayRecord).toBe(false);
  });
});

describe('visual review page', () => {
  it('fingerprints the pictures independent of their order', () => {
    const a = Buffer.from('a');
    const b = Buffer.from('b');
    expect(buildFingerprint({ x: a, y: b })).toBe(buildFingerprint({ y: b, x: a }));
    expect(buildFingerprint({ x: a, y: b })).not.toBe(buildFingerprint({ x: b, y: a }));
    expect(buildFingerprint({ x: a })).toMatch(/^[0-9a-f]{12}$/);
  });

  it('always ends with the two closing questions and carries the data for the page script', () => {
    expect(CLOSING.map((q) => q.id)).toEqual(['BASELINES', 'COMMIT']);
    const html = renderPage(review);
    expect(html).toContain('<title>Site polish</title>');
    expect(html).toContain('id="review-data"');
    expect(html).toContain('"build":"abc123def456"');
    expect(html).toContain('privacy-1280'); // approved earlier: listed, not asked
    expect(html).not.toMatch(/<!doctype|<html|<body/i); // an Artifact fragment; local.html adds the shell
    // The embedded script must parse.
    const script = /<script>([\s\S]*)<\/script>/.exec(html)?.[1] ?? '';
    expect(() => new Function(script)).not.toThrow();
  });

  it('escapes text from the spec', () => {
    const html = renderPage({ ...review, title: 'A <b> & "c"', intro: '<script>alert(1)</script>' });
    expect(html).toContain('<title>A &lt;b&gt; &amp; &quot;c&quot;</title>');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});

describe('visual review page in Hungarian (CMS Coordinator, docs/vera-agent/PRD.md R4)', () => {
  it('asks the same two questions in plain Hungarian and keeps the answer grammar', () => {
    for (const goLive of [false, true]) {
      const hu = closingFor('hu', goLive);
      expect(hu.map((q) => q.id)).toEqual(CLOSING.map((q) => q.id));
      expect(hu.map((q) => q.options.map((o) => o.id))).toEqual(CLOSING.map((q) => q.options.map((o) => o.id)));
    }
    expect(closingFor('hu', true)[1].title).toBe('Közzétehetem az oldalon?');
    expect(closingFor('hu', false)[1].title).not.toBe('Közzétehetem az oldalon?');
    expect(closingFor('en', false)).toBe(CLOSING);
    expect(closingFor('en', true)[1].title).toBe('Publish to the website');
  });

  it('has every piece of wording in both languages', () => {
    expect(Object.keys(UI.hu).sort()).toEqual(Object.keys(UI.en).sort());
    for (const [key, value] of Object.entries(UI.hu)) if (typeof value === 'string') expect(value, key).not.toBe(UI.en[key as keyof typeof UI.en]);
    // In Hungarian the owner sees plain answers; the ids (YES, GO, BASELINES …) stay out of sight and in the pasted text.
    expect(UI.hu.closingIds).toBe(false);
    expect(UI.en.closingIds).toBe(true);
  });

  it('renders the Hungarian page without English wording, and the English page as before', () => {
    const hu = renderPage({ ...review, lang: 'hu', goLive: true });
    for (const text of ['Rendben', 'Javítandó', 'Előtte', 'Válaszok másolása', 'Közzétehetem az oldalon?', 'Megfelel így az új megjelenés?', '3. kör']) expect(hu, text).toContain(text);
    for (const text of ['Copy answers', 'Go-ahead', 'still open', 'Re-record the visual baselines']) expect(hu, text).not.toContain(text);
    expect(hu).toContain('1. rész');
    expect(hu).toContain('"closingIds":false');
    const en = renderPage(review);
    for (const text of ['Copy answers', 'Decisions and go-ahead', 'Re-record the visual baselines under your name', '{n} of {of} still open']) expect(en, text).toContain(text);
    expect(en).not.toContain('Rendben');
  });

  it('answers pasted from the Hungarian page are judged by the same rules', () => {
    // The page stores and pastes OK / Issue and the question ids whatever the wording on screen is.
    const text = pasted('  home-375: OK\n  rental-1280: OK', '  D1 (Hero buttons): B\n  BASELINES (Megfelel így az új megjelenés?): YES\n  COMMIT (Közzétehetem az oldalon?): GO');
    expect(judgeAnswers(parseAnswers(text), review)).toMatchObject({ mayRecord: true, mayCommit: true });
    const wait = pasted('  home-375: OK\n  rental-1280: OK', '  BASELINES (Megfelel így az új megjelenés?): YES\n  COMMIT (Közzétehetem az oldalon?): WAIT');
    expect(judgeAnswers(parseAnswers(wait), review)).toMatchObject({ mayRecord: true, mayCommit: false });
  });
});
