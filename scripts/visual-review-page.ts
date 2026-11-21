/**
 * scripts/visual-review-page.ts — the owner's review page for every visual change.
 *
 * A red visual run is never settled in chat prose. This script turns it into one page that looks
 * and works the same in every session and on every machine: each changed screen as
 * Before / After / Difference with an OK / Issue mark and a note, optional decisions with picture
 * options, two fixed closing questions (re-record the baselines? commit?) and a "Copy answers"
 * button. The owner pastes the copied text into the chat; `--answers` reads it back and says what
 * may happen next. Nothing here re-records a baseline — that stays with `npm run test:visual:update`.
 *
 *   npm run build && npm run test:visual                 # red run → test-results/ holds the pictures
 *   npm run visual:page                                  # → .visual-review/ (index.html, local.html, img/, files.json)
 *   npm run visual:page -- --spec docs/qa/reviews/x.json # with notes per screen, decisions, an intro
 *   npm run visual:page -- --answers answers.txt         # check the pasted answers (exit 0 = may re-record)
 *
 * Publishing and the rules around it: docs/qa/visual-review-process.md.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = path.join(ROOT, 'test-results');
const DEFAULT_OUT = path.join(ROOT, '.visual-review');

export type ReviewLang = 'en' | 'hu';

export interface ReviewOption {
  id: string;
  label: string;
  /** Picture files, relative to the repo root. */
  images?: string[];
  recommended?: boolean;
}
export interface ReviewDecision {
  id: string;
  title: string;
  text?: string;
  options: ReviewOption[];
}
/** Optional context for a review; every field may be left out. */
export interface ReviewSpec {
  title?: string;
  round?: number;
  intro?: string;
  /** What changed, per snapshot id ("home-375"). Shown as a list on that screen's card. */
  screens?: Record<string, string[]>;
  /** Snapshot ids that differ from the baseline but were approved in an earlier round: listed, not asked again. */
  approved?: string[];
  decisions?: ReviewDecision[];
  /** Things only the owner can do (a test mail, a dashboard click) — shown as a list. */
  ownerSteps?: string[];
  /** Language of the page's own wording (default 'en'). The pasted answer format is the same in both. */
  lang?: ReviewLang;
  /**
   * Content release of the CMS Coordinator: the last question means "put it live on the website",
   * not "commit and push the branch" (release-manager, content lane). Default false.
   */
  goLive?: boolean;
}
export interface Screen {
  id: string;
  width: number;
  height: number;
  notes: string[];
}
export interface ReviewData {
  title: string;
  round: number;
  branch: string;
  /** Fingerprint of the pictures under review: the pasted answers are valid for exactly this build. */
  build: string;
  intro: string;
  screens: Screen[];
  approved: string[];
  decisions: (Omit<ReviewDecision, 'options'> & { options: (Omit<ReviewOption, 'images'> & { images: string[] })[] })[];
  ownerSteps: string[];
  lang?: ReviewLang;
  goLive?: boolean;
}

/** The two questions every review ends with. Their ids and answers are part of the answer grammar. */
export const CLOSING: ReviewDecision[] = [
  {
    id: 'BASELINES',
    title: 'Re-record the visual baselines under your name',
    text: 'Replaces the baseline pictures of the screens above with this build and writes a line with your name into docs/qa/visual-baselines-log.md.',
    options: [
      { id: 'YES', label: 'Yes, re-record' },
      { id: 'NO', label: 'Not yet' },
    ],
  },
  {
    id: 'COMMIT',
    title: 'Commit and push this branch',
    text: 'One commit on the working branch, pushed as its own branch. Nothing goes to main; you get the compare link.',
    options: [
      { id: 'GO', label: 'GO: commit and push the branch' },
      { id: 'WAIT', label: 'Wait' },
    ],
  },
];

/**
 * The same two questions in the page's language. Ids and answer ids (BASELINES YES/NO, COMMIT
 * GO/WAIT) never change: they are the answer grammar that `judgeAnswers` reads. With `goLive` the
 * second question is the release itself (content lane of the CMS Coordinator).
 */
export function closingFor(lang: ReviewLang = 'en', goLive = false): ReviewDecision[] {
  if (lang === 'hu') {
    return [
      {
        id: 'BASELINES',
        title: 'Megfelel így az új megjelenés?',
        text: 'Ha igen, a fenti képernyők új megjelenése lesz ezentúl az összehasonlítás alapja, a te neveddel rögzítve.',
        options: [
          { id: 'YES', label: 'Igen, megfelel' },
          { id: 'NO', label: 'Még nem' },
        ],
      },
      goLive
        ? {
            id: 'COMMIT',
            title: 'Közzétehetem az oldalon?',
            text: 'Ha igen, az ellenőrzések után a változtatás megjelenik a fiorevera.hu oldalon. Egyetlen mondattal bármikor visszavonható.',
            options: [
              { id: 'GO', label: 'Igen, közzétehető' },
              { id: 'WAIT', label: 'Várjunk még' },
            ],
          }
        : {
            id: 'COMMIT',
            title: 'Elmenthetem a változtatást?',
            text: 'Elmentem egy külön munkapéldányra. A nyilvános oldalon ettől még semmi sem jelenik meg.',
            options: [
              { id: 'GO', label: 'Igen, mentsd el' },
              { id: 'WAIT', label: 'Várjunk még' },
            ],
          },
    ];
  }
  if (!goLive) return CLOSING;
  return [
    CLOSING[0],
    {
      id: 'COMMIT',
      title: 'Publish to the website',
      text: 'Once the checks have passed, the change is published on fiorevera.hu. It can be undone with a single sentence.',
      options: [
        { id: 'GO', label: 'GO: publish' },
        { id: 'WAIT', label: 'Wait' },
      ],
    },
  ];
}

/** The page's own wording. Screen verdicts are stored and pasted as OK / Issue in every language. */
export const UI = {
  en: {
    before: 'Before',
    after: 'After',
    difference: 'Difference',
    ok: 'OK',
    issue: 'Issue',
    note: 'Note (optional)',
    noteLabel: 'note',
    whichPicture: 'which picture',
    screenshot: 'screenshot, scrollable',
    option: 'option',
    suggested: 'Suggested',
    open: (n: number, of: number) => `${n} of ${of} still open`,
    allAnswered: 'All answered',
    copied: 'Copied. Paste it into the chat.',
    copyByHand: 'Select all in the box and copy it by hand.',
    round: 'round {n}',
    build: 'build',
    part: 'Part {n}',
    /** Show the answer ids (YES, GO …) and the question id next to the two closing questions. */
    closingIds: true,
    screensHeading: (n: number) => `${n} ${n === 1 ? 'screen' : 'screens'} to look at`,
    screensHelp: 'Before is the committed baseline, After is this build, Difference marks the changed pixels in red. Mark every screen OK or Issue.',
    approvedEarlier: 'Changed, and already approved in an earlier round',
    decisionsHeading: 'Decisions and go-ahead',
    goAheadHeading: 'Go-ahead',
    ownerHeading: 'Only you can do these',
    copy: 'Copy answers',
    answersLabel: 'Your answers',
    answersText: 'Answers as text',
    intro:
      'These screens look different from the approved baselines. Mark each one, answer the questions at the end, press Copy answers and paste the text into the chat. Nothing is re-recorded or committed before that.',
  },
  hu: {
    before: 'Előtte',
    after: 'Utána',
    difference: 'Különbség',
    ok: 'Rendben',
    issue: 'Javítandó',
    note: 'Megjegyzés (nem kötelező)',
    noteLabel: 'megjegyzés',
    whichPicture: 'melyik kép',
    screenshot: 'képernyőkép, görgethető',
    option: 'lehetőség',
    suggested: 'Javaslatom',
    open: (n: number, of: number) => `Még ${n} válasz hiányzik (összesen ${of})`,
    allAnswered: 'Minden kérdésre válaszoltál',
    copied: 'A vágólapra másoltam. Illeszd be a beszélgetésbe.',
    copyByHand: 'Jelöld ki a mező teljes tartalmát, és másold ki kézzel.',
    round: '{n}. kör',
    build: 'változat',
    part: '{n}. rész',
    closingIds: false,
    screensHeading: (n: number) => `${n} képernyő vár áttekintésre`,
    screensHelp: 'Az „Előtte” a jelenlegi oldalt, az „Utána” a változtatásodat mutatja; a „Különbség” pirossal jelöli az eltéréseket. Minden képernyőnél jelöld meg: Rendben vagy Javítandó.',
    approvedEarlier: 'Megváltozott, de egy korábbi körben már jóváhagytad',
    decisionsHeading: 'Döntések és jóváhagyás',
    goAheadHeading: 'Jóváhagyás',
    ownerHeading: 'Ezeket csak te tudod elvégezni',
    copy: 'Válaszok másolása',
    answersLabel: 'A válaszaid',
    answersText: 'A válaszok szövegként',
    intro:
      'Ezek a képernyők a változtatás nyomán másként jelennek meg, mint eddig. Tekintsd át mindegyiket, válaszolj a végén a kérdésekre, nyomd meg a „Válaszok másolása” gombot, majd illeszd be a szöveget a beszélgetésbe. Addig a nyilvános oldalon semmi sem változik.',
  },
} as const;

const sha = (data: Buffer | string): string => createHash('sha256').update(data).digest('hex');

/** Every snapshot of the last visual run that differs from its baseline: { id → the three PNG paths }. */
export function failedSnapshots(resultsDir: string = RESULTS): Record<string, { expected: string; actual: string; diff: string }> {
  const out: Record<string, { expected: string; actual: string; diff: string }> = {};
  if (!fs.existsSync(resultsDir)) return out;
  for (const dir of fs.readdirSync(resultsDir).sort()) {
    const full = path.join(resultsDir, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const file of fs.readdirSync(full)) {
      if (!file.endsWith('-diff.png')) continue;
      const id = file.replace(/-diff\.png$/, '');
      const expected = path.join(full, `${id}-expected.png`);
      const actual = path.join(full, `${id}-actual.png`);
      if (fs.existsSync(expected) && fs.existsSync(actual)) out[id] = { expected, actual, diff: path.join(full, file) };
    }
  }
  return out;
}

/** Fingerprint of a set of "after" pictures; order-independent. */
export const buildFingerprint = (actuals: Record<string, Buffer>): string =>
  sha(
    Object.keys(actuals)
      .sort()
      .map((id) => `${id}:${sha(actuals[id])}`)
      .join('\n')
  ).slice(0, 12);

// ── Answers ────────────────────────────────────────────────────────────────────────────────────

export interface ParsedAnswers {
  build: string | null;
  screens: Record<string, { verdict: 'OK' | 'Issue' | null; note: string }>;
  questions: Record<string, { answer: string | null; note: string }>;
}

/** Reads the text the page's "Copy answers" button produces. Tolerant of quoting and extra lines. */
export function parseAnswers(text: string): ParsedAnswers {
  const parsed: ParsedAnswers = { build: null, screens: {}, questions: {} };
  let section: 'screens' | 'questions' | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^[>\s]+/, '').trimEnd();
    const build = /^Build:\s*([0-9a-f]{6,})/i.exec(line);
    if (build) parsed.build = build[1].toLowerCase();
    else if (/^Screens:/i.test(line)) section = 'screens';
    else if (/^(Questions|Decisions):/i.test(line)) section = 'questions';
    else if (section) {
      const m = /^([A-Za-z0-9-]+)(?:\s*\([^)]*\))?:\s*(.*)$/.exec(line);
      if (!m) continue;
      const [value, ...rest] = m[2].split(/\s+—\s+/);
      const note = rest.join(' — ').trim();
      const answered = !/NOT ANSWERED/i.test(value) && value.trim() !== '' && value.trim() !== '—';
      if (section === 'screens') {
        const verdict = !answered ? null : /^ok$/i.test(value.trim()) ? 'OK' : /^issue$/i.test(value.trim()) ? 'Issue' : null;
        parsed.screens[m[1]] = { verdict, note };
      } else parsed.questions[m[1]] = { answer: answered ? value.trim() : null, note };
    }
  }
  return parsed;
}

export interface AnswerVerdict {
  /** True only when every screen under review is OK, BASELINES is YES and the answers belong to this build. */
  mayRecord: boolean;
  /** True only when `mayRecord` holds and COMMIT is GO. */
  mayCommit: boolean;
  problems: string[];
  issues: { id: string; note: string }[];
}

/** The one rule set for acting on answers — the same in every session. */
export function judgeAnswers(answers: ParsedAnswers, review: Pick<ReviewData, 'build' | 'screens'>): AnswerVerdict {
  const problems: string[] = [];
  const issues: { id: string; note: string }[] = [];
  if (!answers.build) problems.push('the answers carry no "Build:" line — ask for a fresh copy from the page');
  else if (answers.build !== review.build) problems.push(`the answers are for build ${answers.build}, the pictures on disk are build ${review.build} — the owner must look at the current page`);
  for (const screen of review.screens) {
    const a = answers.screens[screen.id];
    if (!a || a.verdict === null) problems.push(`${screen.id}: not answered`);
    else if (a.verdict === 'Issue') issues.push({ id: screen.id, note: a.note });
  }
  const baselines = answers.questions.BASELINES?.answer?.toUpperCase() ?? null;
  const commit = answers.questions.COMMIT?.answer?.toUpperCase() ?? null;
  if (baselines !== 'YES') problems.push(`BASELINES is ${baselines ?? 'not answered'} — no re-record`);
  const mayRecord = problems.length === 0 && issues.length === 0;
  return { mayRecord, mayCommit: mayRecord && commit === 'GO', problems, issues };
}

// ── Page ───────────────────────────────────────────────────────────────────────────────────────

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STYLE = `
  :root { --bg:#faf7f2; --surface:#fff; --warm:#f3ede4; --fg:#2c2825; --muted:#6b635b; --sage:#5f6f60; --sage-soft:#e3e8e2; --blush:#f6e7e8; --gold:#a4841f; --line:rgba(44,40,37,.14); --ok:#4e6b4f; --warn:#9b3b3b; --frame:#e9e2d6;
    --display:'Cormorant Garamond','Playfair Display',Georgia,serif; --body:'Inter',system-ui,-apple-system,sans-serif }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#1f1c1a; --surface:#2a2623; --warm:#332e2a; --fg:#f1ece4; --muted:#b5aba0; --sage:#a9bba9; --sage-soft:#364037; --blush:#45383a; --gold:#d9bd62; --line:rgba(241,236,228,.16); --ok:#9fc0a0; --warn:#e39a9a; --frame:#3a342f; color-scheme:dark } }
  :root[data-theme="dark"] { --bg:#1f1c1a; --surface:#2a2623; --warm:#332e2a; --fg:#f1ece4; --muted:#b5aba0; --sage:#a9bba9; --sage-soft:#364037; --blush:#45383a; --gold:#d9bd62; --line:rgba(241,236,228,.16); --ok:#9fc0a0; --warn:#e39a9a; --frame:#3a342f; color-scheme:dark }
  body { background:var(--bg); color:var(--fg); font:400 16px/1.6 var(--body); margin:0 }
  .wrap { max-width:68rem; margin-inline:auto; padding-block:2.5rem 5rem; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); display:grid; gap:2.5rem }
  h1,h2,h3 { font-family:var(--display); font-weight:500; line-height:1.15; margin:0; text-wrap:balance }
  h1 { font-size:clamp(2.2rem,1.6rem + 2.6vw,3.4rem) } h2 { font-size:clamp(1.6rem,1.3rem + 1.2vw,2.1rem) } h3 { font-size:1.35rem }
  p { margin:0; max-width:46rem } img { max-width:100% }
  .eyebrow { font:600 .75rem/1 var(--body); letter-spacing:.14em; text-transform:uppercase; color:var(--sage) }
  .muted { color:var(--muted) } .stack { display:grid; gap:1rem }
  .item { background:var(--surface); border:1px solid var(--line); border-radius:16px; padding:1.25rem; display:grid; gap:1rem; min-width:0 }
  .item header { display:flex; flex-wrap:wrap; align-items:baseline; gap:.5rem 1rem; justify-content:space-between }
  .item ul { margin:0; padding-left:1.2rem }
  .tag { font:600 .72rem/1 var(--body); letter-spacing:.1em; text-transform:uppercase; color:var(--gold) }
  .seg { display:inline-flex; border:1px solid var(--line); border-radius:999px; overflow:hidden }
  .seg button { font:500 .85rem var(--body); padding:.45rem .9rem; border:0; background:transparent; color:var(--fg); cursor:pointer }
  .seg button[aria-pressed="true"] { background:var(--sage); color:var(--bg) }
  .shot { max-height:34rem; overflow:auto; background:var(--frame); border-radius:10px; padding:.75rem; text-align:center }
  .shot img { display:inline-block; height:auto; border-radius:4px; box-shadow:0 1px 6px rgba(0,0,0,.18) }
  .shot.narrow img { max-width:min(100%,375px) }
  .pair { display:grid; grid-template-columns:repeat(auto-fit,minmax(14rem,1fr)); gap:.75rem }
  .opt { display:grid; gap:.5rem; align-content:start; padding:.75rem; border:1px solid var(--line); border-radius:12px; cursor:pointer; min-width:0 }
  .opt:has(input:checked) { border-color:var(--sage); box-shadow:0 0 0 2px var(--sage-soft) }
  .opt img { border-radius:6px; background:var(--frame) }
  .opt .label { display:flex; gap:.5rem; align-items:flex-start; font-weight:500 }
  .rec { font:600 .68rem/1 var(--body); letter-spacing:.08em; text-transform:uppercase; color:var(--ok); border:1px solid currentColor; border-radius:999px; padding:.2rem .45rem; white-space:nowrap }
  .verdict { display:flex; flex-wrap:wrap; gap:.75rem 1.25rem; align-items:center }
  .verdict label { display:inline-flex; gap:.4rem; align-items:center; font-weight:500 }
  input[type="text"],textarea { font:inherit; color:var(--fg); background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:.5rem .7rem; width:100%; min-width:0; box-sizing:border-box }
  .verdict input[type="text"] { flex:1 1 14rem; width:auto }
  input[type="radio"] { accent-color:var(--sage); width:1.1rem; height:1.1rem }
  .export { position:sticky; bottom:0; background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:1rem 1.25rem; display:grid; gap:.75rem; box-shadow:0 -4px 18px rgba(0,0,0,.08); padding-bottom:calc(1rem + env(safe-area-inset-bottom,0px)) }
  .btn { font:600 .9rem var(--body); padding:.7rem 1.4rem; border-radius:999px; border:0; background:var(--sage); color:var(--bg); cursor:pointer }
  :focus-visible { outline:3px solid var(--gold); outline-offset:2px }
  #out { min-height:9rem; font:400 .85rem/1.5 ui-monospace,Menlo,monospace }
  .count { font-weight:600 } .count.open { color:var(--warn) }
`;

/** Runs in the page. Kept as a plain string so the page needs no build step and no library. */
const SCRIPT = `
  const DATA = JSON.parse(document.getElementById('review-data').textContent);
  const CLOSING = JSON.parse(document.getElementById('review-closing').textContent);
  const UI = JSON.parse(document.getElementById('review-ui').textContent);
  const $ = (tag, attrs = {}, kids = []) => { const el = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'text') el.textContent = v; else el.setAttribute(k, v); } for (const kid of [].concat(kids)) el.append(kid); return el; };
  const KEY = 'visual-review:' + DATA.build;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { saved = {}; }
  const remember = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* a convenience only */ } render(); };
  const noteInput = (key, label) => { const n = $('input', { type: 'text', id: key + '-note', placeholder: UI.note, 'aria-label': label + ': ' + UI.noteLabel }); n.value = saved[key + ':note'] || ''; n.addEventListener('input', () => { saved[key + ':note'] = n.value; remember(); }); return n; };

  const screens = document.getElementById('screens');
  for (const s of DATA.screens) {
    const img = $('img', { src: 'img/' + s.id + '-actual.jpg', alt: s.id + ': ' + UI.after.toLowerCase(), loading: 'lazy' });
    const seg = $('div', { class: 'seg', role: 'group', 'aria-label': s.id + ': ' + UI.whichPicture });
    for (const [kind, label] of [['expected', UI.before], ['actual', UI.after], ['diff', UI.difference]]) {
      const b = $('button', { type: 'button', 'aria-pressed': String(kind === 'actual'), text: label });
      b.addEventListener('click', () => { img.src = 'img/' + s.id + '-' + kind + '.jpg'; img.alt = s.id + ': ' + label.toLowerCase(); seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
      seg.append(b);
    }
    const key = 'S:' + s.id;
    const verdict = $('div', { class: 'verdict' });
    for (const v of ['OK', 'Issue']) { const r = $('input', { type: 'radio', name: key, id: key + '-' + v, value: v }); r.checked = saved[key] === v; r.addEventListener('change', () => { saved[key] = v; remember(); }); verdict.append($('label', { for: key + '-' + v }, [r, v === 'OK' ? UI.ok : UI.issue])); }
    verdict.append(noteInput(key, s.id));
    const kids = [$('header', {}, [$('h3', { text: s.id }), seg])];
    if (s.notes.length) kids.push($('ul', {}, s.notes.map((n) => $('li', { text: n }))));
    kids.push($('div', { class: 'shot' + (s.width <= 420 ? ' narrow' : ''), tabindex: '0', 'aria-label': s.id + ': ' + UI.screenshot }, [img]), verdict);
    screens.append($('article', { class: 'item' }, kids));
  }

  const QUESTIONS = [...DATA.decisions, ...CLOSING];
  const decisions = document.getElementById('questions');
  for (const d of QUESTIONS) {
    const key = 'Q:' + d.id;
    const plain = !UI.closingIds && CLOSING.some((c) => c.id === d.id);
    const pair = $('div', { class: 'pair' });
    for (const o of d.options) {
      const r = $('input', { type: 'radio', name: key, id: key + '-' + o.id, value: o.id });
      r.checked = saved[key] === o.id;
      r.addEventListener('change', () => { saved[key] = o.id; remember(); });
      const box = $('label', { class: 'opt', for: key + '-' + o.id }, [$('span', { class: 'label' }, [r, $('span', { text: plain ? o.label : o.id + '. ' + o.label })])]);
      if (o.recommended) box.append($('span', {}, [$('span', { class: 'rec', text: UI.suggested })]));
      for (const src of o.images || []) box.append($('img', { src, alt: d.title + ', ' + UI.option + ' ' + o.id, loading: 'lazy' }));
      pair.append(box);
    }
    const kids = [$('header', {}, plain ? [$('h3', { text: d.title })] : [$('h3', { text: d.title }), $('span', { class: 'tag', text: d.id })])];
    if (d.text) kids.push($('p', { text: d.text }));
    kids.push(pair, noteInput(key, d.title));
    decisions.append($('article', { class: 'item' }, kids));
  }

  const out = document.getElementById('out');
  const status = document.getElementById('status');
  function render() {
    const lines = ['VISUAL REVIEW — ' + DATA.title + ' — round ' + DATA.round, 'Branch: ' + DATA.branch, 'Build: ' + DATA.build, '', 'Screens:'];
    let open = 0;
    for (const s of DATA.screens) { const v = saved['S:' + s.id]; if (!v) open++; const n = saved['S:' + s.id + ':note']; lines.push('  ' + s.id + ': ' + (v || '— NOT ANSWERED') + (n ? ' — ' + n : '')); }
    lines.push('', 'Questions:');
    for (const d of QUESTIONS) { const v = saved['Q:' + d.id]; if (!v) open++; const n = saved['Q:' + d.id + ':note']; lines.push('  ' + d.id + ' (' + d.title + '): ' + (v || '— NOT ANSWERED') + (n ? ' — ' + n : '')); }
    out.value = lines.join('\\n');
    status.textContent = open ? UI.open.replace('{n}', open).replace('{of}', DATA.screens.length + QUESTIONS.length) : UI.allAnswered;
    status.className = 'count' + (open ? ' open' : '');
  }
  render();
  document.getElementById('copy').addEventListener('click', async () => {
    render();
    try { await navigator.clipboard.writeText(out.value); status.textContent = UI.copied; }
    catch { out.focus(); out.select(); status.textContent = UI.copyByHand; }
  });
`;

/** The page body (an Artifact fragment: title, styles, content, script — no <html>/<body> of its own). */
export function renderPage(data: ReviewData): string {
  const json = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');
  const list = (items: string[]): string => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const ui = UI[data.lang ?? 'en'];
  // Functions cannot travel to the page as JSON: the two counted strings go as templates.
  const pageUi = { ...ui, open: ui.open(-1, -2).replace('-1', '{n}').replace('-2', '{of}'), screensHeading: undefined };
  return `<title>${esc(data.title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600&display=swap">
<style>${STYLE}</style>
<div class="wrap">
  <header class="stack">
    <span class="eyebrow">Fiore Vera · ${esc(data.branch)} · ${ui.round.replace('{n}', String(data.round))} · ${ui.build} ${esc(data.build)}</span>
    <h1>${esc(data.title)}</h1>
    <p>${esc(data.intro)}</p>
  </header>
  <section class="stack">
    <span class="eyebrow">${ui.part.replace('{n}', '1')}</span>
    <h2>${esc(ui.screensHeading(data.screens.length))}</h2>
    <p class="muted">${esc(ui.screensHelp)}</p>
    <div class="stack" id="screens"></div>
    ${data.approved.length ? `<div class="item"><h3>${esc(ui.approvedEarlier)}</h3><p class="muted">${data.approved.map(esc).join(' · ')}</p></div>` : ''}
  </section>
  <section class="stack">
    <span class="eyebrow">${ui.part.replace('{n}', '2')}</span>
    <h2>${esc(data.decisions.length ? ui.decisionsHeading : ui.goAheadHeading)}</h2>
    <div class="stack" id="questions"></div>
  </section>
  ${data.ownerSteps.length ? `<section class="stack"><span class="eyebrow">${ui.part.replace('{n}', '3')}</span><h2>${esc(ui.ownerHeading)}</h2><div class="item">${list(data.ownerSteps)}</div></section>` : ''}
  <section class="export" aria-label="${esc(ui.answersLabel)}">
    <div class="verdict"><button class="btn" id="copy" type="button">${esc(ui.copy)}</button><span id="status" class="count" role="status"></span></div>
    <textarea id="out" readonly aria-label="${esc(ui.answersText)}"></textarea>
  </section>
</div>
<script type="application/json" id="review-data">${json(data)}</script>
<script type="application/json" id="review-closing">${json(closingFor(data.lang, data.goLive))}</script>
<script type="application/json" id="review-ui">${json(pageUi)}</script>
<script>${SCRIPT}</script>
`;
}

// ── Command line ───────────────────────────────────────────────────────────────────────────────

const arg = (argv: readonly string[], name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const currentBranch = (): string => {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
};

async function generate(argv: readonly string[]): Promise<void> {
  const out = path.resolve(arg(argv, 'out') ?? DEFAULT_OUT);
  const specPath = arg(argv, 'spec');
  const spec: ReviewSpec = specPath ? (JSON.parse(fs.readFileSync(path.resolve(specPath), 'utf8')) as ReviewSpec) : {};
  const failed = failedSnapshots();
  const ids = Object.keys(failed).sort();
  if (ids.length === 0 && !spec.decisions?.length) {
    console.log('visual-review: no snapshot differs from its baseline in test-results/ and the spec has no decisions — nothing to review.');
    console.log('visual-review: run `npm run build && npm run test:visual` first; a green run needs no review page.');
    return;
  }
  const approved = (spec.approved ?? []).filter((id) => ids.includes(id));
  const review = ids.filter((id) => !approved.includes(id));

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'img'), { recursive: true });
  const files: string[] = [];
  const actuals: Record<string, Buffer> = {};
  const screens: Screen[] = [];
  for (const id of ids) actuals[id] = fs.readFileSync(failed[id].actual);
  for (const id of review) {
    for (const kind of ['expected', 'actual', 'diff'] as const) {
      const rel = `img/${id}-${kind}.jpg`;
      await sharp(failed[id][kind]).jpeg({ quality: kind === 'diff' ? 60 : 76 }).toFile(path.join(out, rel));
      files.push(rel);
    }
    const meta = await sharp(failed[id].actual).metadata();
    screens.push({ id, width: meta.width, height: meta.height, notes: spec.screens?.[id] ?? [] });
  }
  const decisions: ReviewData['decisions'] = [];
  for (const d of spec.decisions ?? []) {
    const options: ReviewData['decisions'][number]['options'] = [];
    for (const o of d.options) {
      const images: string[] = [];
      for (const [i, src] of (o.images ?? []).entries()) {
        const rel = `img/opt-${d.id}-${o.id}-${i + 1}.jpg`.toLowerCase();
        await sharp(path.resolve(ROOT, src)).jpeg({ quality: 80 }).toFile(path.join(out, rel));
        images.push(rel);
        files.push(rel);
      }
      options.push({ id: o.id, label: o.label, recommended: o.recommended, images });
    }
    decisions.push({ id: d.id, title: d.title, text: d.text, options });
  }
  const data: ReviewData = {
    title: spec.title ?? 'Visual review',
    round: spec.round ?? 1,
    branch: currentBranch(),
    build: buildFingerprint(actuals),
    intro: spec.intro ?? UI[spec.lang ?? 'en'].intro,
    screens,
    approved,
    decisions,
    ownerSteps: spec.ownerSteps ?? [],
    ...(spec.lang ? { lang: spec.lang } : {}),
    ...(spec.goLive ? { goLive: true } : {}),
  };
  const fragment = renderPage(data);
  fs.writeFileSync(path.join(out, 'index.html'), fragment);
  // The same page as a complete document, for a plain browser (the Artifact host adds this shell itself).
  fs.writeFileSync(
    path.join(out, 'local.html'),
    `<!doctype html>\n<html lang="${data.lang ?? 'en'}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n</head>\n<body>\n${fragment}</body>\n</html>\n`
  );
  fs.writeFileSync(path.join(out, 'files.json'), JSON.stringify(files.map((p) => ({ path: p }))) + '\n');
  fs.writeFileSync(path.join(out, 'review.json'), JSON.stringify(data, null, 2) + '\n');
  const rel = path.relative(ROOT, out);
  console.log(`visual-review: ${screens.length} screen(s) to review, ${approved.length} already approved, ${decisions.length} decision(s) — build ${data.build}`);
  console.log(`visual-review: page    ${rel}/index.html  (Artifact: publish it with root = ${rel} and files = the list in ${rel}/files.json)`);
  console.log(`visual-review: browser ${rel}/local.html  (serve the folder over HTTP: ./node_modules/.bin/vite preview --outDir ${rel} --port 4175, then open /local.html)`);
  console.log('visual-review: after the owner pasted the answers: npm run visual:page -- --answers <file with the pasted text>');
}

function checkAnswers(file: string, argv: readonly string[]): void {
  const out = path.resolve(arg(argv, 'out') ?? DEFAULT_OUT);
  const reviewFile = path.join(out, 'review.json');
  if (!fs.existsSync(reviewFile)) throw new Error(`${path.relative(ROOT, reviewFile)} is missing — generate the page first (npm run visual:page)`);
  const review = JSON.parse(fs.readFileSync(reviewFile, 'utf8')) as ReviewData;
  const text = file === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(path.resolve(file), 'utf8');
  const answers = parseAnswers(text);
  const verdict = judgeAnswers(answers, review);
  for (const issue of verdict.issues) console.log(`visual-review: ISSUE ${issue.id}${issue.note ? ` — ${issue.note}` : ''}`);
  for (const problem of verdict.problems) console.log(`visual-review: ${problem}`);
  for (const d of review.decisions) {
    const a = answers.questions[d.id];
    console.log(`visual-review: decision ${d.id} = ${a?.answer ?? 'NOT ANSWERED'}${a?.note ? ` — ${a.note}` : ''}`);
  }
  if (verdict.mayRecord) {
    console.log('visual-review: every screen is OK and BASELINES is YES → npm run test:visual:update -- --approved-by="<the owner\'s name>" --note="<what changed>"');
    console.log(`visual-review: COMMIT is ${verdict.mayCommit ? 'GO → commit and push the branch after the re-record' : 'not GO → do not commit'}`);
  } else {
    console.log('visual-review: NOT approved — fix the issues, run the visual suite again, generate a new round, ask again. Do not re-record.');
    process.exitCode = 1;
  }
}

// Run only as a script; the unit test imports the pure functions above.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const answers = arg(argv, 'answers');
  (answers ? Promise.resolve(checkAnswers(answers, argv)) : generate(argv)).catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
