/**
 * visual-contact-sheet.mjs — writes tests/visual/review.html: one scrollable page showing every
 * committed pixel baseline scaled down, grouped by what it covers, with filename, natural size and
 * a short list of what a human must check in that group. The pixel gate only proves "looks like
 * before"; this sheet is how the owner reviews "before" once, and after every re-baseline.
 *
 *   node scripts/visual-contact-sheet.mjs        # then open tests/visual/review.html
 *
 * Verdicts (OK / issue + note) are kept in the browser's localStorage and can be copied as text.
 * No dependencies: PNG sizes are read from the IHDR chunk.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const shotDir = join(root, 'tests/visual/__screenshots__/snapshots.spec.ts');
const outFile = join(root, 'tests/visual/review.html');

const pngSize = (file) => {
  const b = readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), bytes: b.length };
};

const files = readdirSync(shotDir)
  .filter((f) => f.endsWith('.png'))
  .sort()
  .map((name) => ({ name, src: relative(join(root, 'tests/visual'), join(shotDir, name)), ...pngSize(join(shotDir, name)) }));

const PAGE_IDS = ['home', 'services', 'gallery', 'rental', 'about', 'contact', 'privacy', 'notfound'];
const match = (re) => files.filter((f) => re.test(f.name));

/** Groups in review order; `check` is what the pixel gate cannot judge and a human must. */
const groups = [
  {
    title: 'Hungarian pages — full-page clip at 375 and 1280 px',
    note: 'Clip height is intentional (1500 px, gallery 1100 px): the bottom edge cutting a section is NOT a defect.',
    check: [
      'Hero photo: crop and focal point acceptable at both widths; no visible upscaling or blur',
      'Headings render in the serif (Cormorant Garamond), body in Inter — no fallback font, no wordmark wrapping',
      'Spacing between sections is even; no element touches the viewport edge without its gutter',
      'No placeholder, lorem ipsum, missing-image box or legacy typo in the visible copy',
      'Colours match the locked tokens (linen background, sage, blush, gold); nothing looks washed out or neon',
    ],
    items: PAGE_IDS.flatMap((id) => match(new RegExp(`^${id}-(375|1280)\\.png$`))),
  },
  {
    title: 'German and English home — 375 px',
    note: 'Only the phone width is recorded until the DE/EN copy is signed off (R-1); inner DE/EN pages have no pixel baseline yet.',
    check: [
      'Layout identical to the HU home at 375 px; only the copy differs',
      'Copy is in the right language; no Hungarian text leaking into DE/EN sections',
      'Umlauts and ß render; no line that wraps awkwardly because the translation is longer',
      'The language switch and the toast are not visible (toast pre-dismissed by design)',
    ],
    items: match(/^home-(de|en)-375\.png$/),
  },
  {
    title: 'Header strip — 1120, 1280, 1440, 1920 px (top 96 px of the home page)',
    note: 'These guard the wordmark-wrapping regression. Shown scaled to the column width; open a strip to see it 1:1.',
    check: [
      'Wordmark on one line at every width',
      'Nav items evenly spaced, nothing clipped at the 96 px bottom edge',
      'Quote button visible from 1280 px; language switch visible',
      'Glass bar readable over the hero; bar does not stretch past 90rem on 1920',
    ],
    items: match(/^header-\d+\.png$/),
  },
  {
    title: 'Mobile menu open — 375 × 812',
    check: [
      'Panel covers the page; menu items in the agreed order; current page marked',
      'Close control and language switch reachable; toast hidden while the menu is open',
      'Typography and spacing in the panel match the rest of the site',
    ],
    items: match(/^menu-open-375\.png$/),
  },
  {
    title: 'Gallery — first carousel on slide 2, at 375 and 1280 px',
    check: [
      'Slide 2 is a real album photo (not the cover); 3:2 centre crop acceptable for this photo',
      'Arrows visible on top of the photo at both widths; counter or dots readable',
      'Photo sharp at 1280 (1280 px image tier in use); no letterboxing',
    ],
    items: match(/^carousel-slide2-\d+\.png$/),
  },
  {
    title: 'Language toast — 375 and 1280 px (German browser on the HU home)',
    note: 'Approved by the owner on 2026-11-09 (log row 2); included so the whole set is reviewed in one place.',
    check: ['CTA fills the action row, dismiss flush right — the approved layout', 'German copy correct (rendered in the target locale)'],
    items: match(/^toast-\d+\.png$/),
  },
];

const covered = new Set(groups.flatMap((g) => g.items.map((i) => i.name)));
const orphans = files.filter((f) => !covered.has(f.name));
if (orphans.length) groups.push({ title: 'Not grouped (add a group in scripts/visual-contact-sheet.mjs)', check: [], items: orphans });

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const kb = (n) => `${Math.round(n / 1024)} KB`;
const totalBytes = files.reduce((n, f) => n + f.bytes, 0);
const generated = new Date().toISOString().slice(0, 10);

const itemHtml = (f) => `
      <figure class="shot" data-name="${esc(f.name)}" style="--w:${f.width};--h:${f.height}">
        <a href="${esc(f.src)}" target="_blank" rel="noopener" title="Open ${esc(f.name)} at natural size"><img src="${esc(f.src)}" alt="${esc(f.name)}" loading="lazy" width="${f.width}" height="${f.height}"></a>
        <figcaption>
          <code>${esc(f.name)}</code> <span class="dim">${f.width} × ${f.height} px · ${kb(f.bytes)}</span>
          <span class="verdict">
            <label><input type="radio" name="v-${esc(f.name)}" value="ok"> OK</label>
            <label><input type="radio" name="v-${esc(f.name)}" value="issue"> Issue</label>
            <input type="text" class="note" placeholder="what is off (optional)">
          </span>
        </figcaption>
      </figure>`;

const groupHtml = (g, i) => `
  <section class="group" id="g${i + 1}">
    <h2>${i + 1}. ${esc(g.title)} <span class="dim">(${g.items.length})</span></h2>
    ${g.note ? `<p class="note-text">${esc(g.note)}</p>` : ''}
    ${g.check.length ? `<ul class="check">${g.check.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
    <div class="grid">${g.items.map(itemHtml).join('')}</div>
  </section>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fiore Vera — visual baseline contact sheet</title>
<style>
  :root { --linen:#faf7f2; --sage:#7a8b7b; --blush:#e8c5c8; --gold:#d4af37; --ink:#2c2825; --muted:#6b635b; --scale:0.5; }
  * { box-sizing:border-box }
  body { margin:0; background:var(--linen); color:var(--ink); font:15px/1.5 Inter, system-ui, sans-serif; }
  header.top { position:sticky; top:0; z-index:2; background:rgba(250,247,242,.94); backdrop-filter:blur(6px); border-bottom:1px solid #e3ddd3; padding:12px 24px; display:flex; flex-wrap:wrap; gap:12px 24px; align-items:center; }
  header.top h1 { font:600 20px/1.2 "Cormorant Garamond", Georgia, serif; margin:0; }
  header.top .dim, .dim { color:var(--muted); font-size:13px; }
  header.top label { font-size:13px; }
  header.top select, header.top button { font:inherit; font-size:13px; padding:3px 8px; border:1px solid #cfc8bd; border-radius:6px; background:#fff; color:var(--ink); }
  header.top button { cursor:pointer }
  header.top button:hover { border-color:var(--sage) }
  nav.toc { display:flex; flex-wrap:wrap; gap:6px 14px; font-size:13px; width:100% }
  nav.toc a { color:var(--sage); text-decoration:none } nav.toc a:hover { text-decoration:underline }
  main { padding:16px 24px 64px; max-width:1680px; margin:0 auto; }
  .group { margin:32px 0 }
  .group h2 { font:600 22px/1.2 "Cormorant Garamond", Georgia, serif; margin:0 0 6px; }
  .note-text { margin:0 0 6px; color:var(--muted); font-size:13px }
  ul.check { margin:0 0 14px; padding:0 0 0 18px; font-size:13px; color:var(--muted); columns:2; column-gap:32px }
  ul.check li { break-inside:avoid; margin:2px 0 }
  .grid { display:flex; flex-wrap:wrap; gap:20px 24px; align-items:flex-start }
  .shot { margin:0; width:calc(var(--w) * 1px * var(--scale)); max-width:100%; }
  .shot a { display:block; border:1px solid #d9d2c7; background:#fff; box-shadow:0 2px 10px rgba(44,40,37,.08); }
  .shot img { display:block; width:100%; height:auto; }
  .shot figcaption { margin-top:6px; font-size:12px; display:flex; flex-wrap:wrap; gap:4px 10px; align-items:center }
  .shot code { font-size:12px; background:#f0ebe3; padding:1px 5px; border-radius:4px }
  .verdict { display:flex; gap:8px; align-items:center; width:100% }
  .verdict label { cursor:pointer }
  .verdict .note { flex:1; min-width:120px; font:inherit; font-size:12px; padding:2px 6px; border:1px solid #d9d2c7; border-radius:4px; background:#fff }
  .shot.ok a { outline:2px solid var(--sage) } .shot.issue a { outline:2px solid #c0392b }
  #summary { width:100%; margin-top:8px; font:12px/1.4 ui-monospace, Menlo, monospace; min-height:0; height:0; padding:0; border:0; opacity:0; transition:height .2s }
  #summary.open { height:180px; padding:8px; border:1px solid #cfc8bd; opacity:1; background:#fff }
</style>
</head>
<body>
<header class="top">
  <h1>Fiore Vera — visual baselines</h1>
  <span class="dim">${files.length} PNGs · ${(totalBytes / 1048576).toFixed(1)} MB · generated ${generated} · Chromium on macOS, CSS pixels</span>
  <label>Scale <select id="scale"><option value="0.33">33 %</option><option value="0.5" selected>50 %</option><option value="0.75">75 %</option><option value="1">100 %</option></select></label>
  <span class="dim" id="progress"></span>
  <button type="button" id="copy">Copy verdicts</button>
  <button type="button" id="reset">Clear verdicts</button>
  <nav class="toc">${groups.map((g, i) => `<a href="#g${i + 1}">${i + 1}. ${esc(g.title.split(' — ')[0])}</a>`).join('')}</nav>
  <textarea id="summary" readonly aria-label="Verdict summary"></textarea>
</header>
<main>
  <p class="dim">Click any image to open the PNG at natural size in a new tab. The pixel gate only proves "looks like before" — this page is where "before" gets a human look. Mark every image OK or Issue, then "Copy verdicts" and paste the text into the chat.</p>
  ${groups.map(groupHtml).join('\n')}
</main>
<script>
(() => {
  const KEY = 'fv-visual-review';
  let state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { state = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const shots = Array.from(document.querySelectorAll('.shot'));
  const progress = document.getElementById('progress');
  const paint = (fig) => {
    const s = state[fig.dataset.name] || {};
    fig.classList.toggle('ok', s.verdict === 'ok');
    fig.classList.toggle('issue', s.verdict === 'issue');
    for (const r of fig.querySelectorAll('input[type=radio]')) r.checked = r.value === s.verdict;
    fig.querySelector('.note').value = s.note || '';
  };
  const refresh = () => {
    const done = shots.filter((f) => state[f.dataset.name]?.verdict).length;
    const issues = shots.filter((f) => state[f.dataset.name]?.verdict === 'issue').length;
    progress.textContent = done + ' / ' + shots.length + ' reviewed' + (issues ? ', ' + issues + ' with issues' : '');
  };
  for (const fig of shots) {
    paint(fig);
    fig.addEventListener('change', (e) => {
      const name = fig.dataset.name;
      state[name] = state[name] || {};
      if (e.target.type === 'radio') state[name].verdict = e.target.value;
      if (e.target.classList.contains('note')) state[name].note = e.target.value;
      save(); paint(fig); refresh();
    });
    fig.querySelector('.note').addEventListener('input', (e) => { const n = fig.dataset.name; state[n] = state[n] || {}; state[n].note = e.target.value; save(); });
  }
  refresh();
  const scale = document.getElementById('scale');
  try { const s = localStorage.getItem(KEY + '-scale'); if (s) scale.value = s; } catch {}
  document.documentElement.style.setProperty('--scale', scale.value);
  scale.addEventListener('change', () => { document.documentElement.style.setProperty('--scale', scale.value); try { localStorage.setItem(KEY + '-scale', scale.value); } catch {} });
  const summary = document.getElementById('summary');
  document.getElementById('copy').addEventListener('click', async () => {
    const lines = shots.map((f) => { const s = state[f.dataset.name] || {}; return (s.verdict === 'ok' ? 'OK    ' : s.verdict === 'issue' ? 'ISSUE ' : '      ') + f.dataset.name + (s.note ? ' — ' + s.note : ''); });
    const text = 'Visual baseline review ' + new Date().toISOString().slice(0, 10) + '\\n' + lines.join('\\n');
    summary.value = text; summary.classList.add('open');
    try { await navigator.clipboard.writeText(text); } catch {}
  });
  document.getElementById('reset').addEventListener('click', () => { if (!confirm('Clear all verdicts on this page?')) return; state = {}; save(); shots.forEach(paint); refresh(); summary.classList.remove('open'); });
})();
</script>
</body>
</html>
`;

writeFileSync(outFile, html);
console.log(`visual-contact-sheet: ${files.length} baselines (${(totalBytes / 1048576).toFixed(1)} MB) in ${groups.length} groups → ${relative(root, outFile)}`);
if (orphans.length) console.log('  ungrouped: ' + orphans.map((f) => f.name).join(', '));
