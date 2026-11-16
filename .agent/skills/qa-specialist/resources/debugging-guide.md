# Debugging a red gate — Fiore Vera

Everything here runs from the repo root. Call Playwright and Vitest through `./node_modules/.bin/<bin>`; the RTK shell hook rewrites `npx <bin>` to `npm run <bin>`, which only works for scripts in `package.json`.

## Where things land

| Suite | Config | Server | Artefacts |
|---|---|---|---|
| Unit | `vite.config.ts` (`test` block) | none (jsdom; `render.test.tsx` uses `src/entry-server.tsx`) | terminal only |
| E2E | `playwright.config.ts` | dev server :5173 (`npm run dev`, reused if running) | `test-results/` (traces on first retry only on CI → pass `--trace on` locally) |
| Visual | `playwright.visual.config.ts` | `vite preview --port 4173` serving `dist/` (reused if running) | `playwright-report-visual/index.html` (expected / actual / diff), `test-results/**/trace.zip` on failure |

`test-results/` and `playwright-report-visual/` are git-ignored. `tests/visual/__screenshots__/` is committed — do not delete or regenerate it to get green.

## Commands

```bash
# one unit file / one test name
npm test -- --run tests/unit/render.test.tsx
npm test -- --run -t "renders a localized 404"

# one e2e spec on one browser, line reporter, trace always
./node_modules/.bin/playwright test tests/e2e/contact.spec.ts --project=chromium --reporter=line --trace on

# only the tests matching a title
./node_modules/.bin/playwright test -g "mobile menu"

# visual: rebuild first, then one page, then open the report
npm run build
./node_modules/.bin/playwright test -c playwright.visual.config.ts -g "services @ 1280"
./node_modules/.bin/playwright show-report playwright-report-visual

# open a trace
./node_modules/.bin/playwright show-trace test-results/<test-dir>/trace.zip

# headed / step-through
./node_modules/.bin/playwright test tests/e2e/gallery.spec.ts --project=chromium --headed --debug
```

`--reporter=line` is the quiet choice inside an agent shell; the default `list` reporter prints one line per test × project (284 lines for the full e2e run).

## Reading a visual failure
1. Rebuild. `reuseExistingServer: true` means a preview started before your change serves the old `dist/`.
2. Open the HTML report; look at the diff image, then expected vs actual.
3. Diff limited to the component you changed → it is your change: show the owner, get a GO, then `npm run test:visual:update`.
4. Diff everywhere (text edges, 1-px shifts on every page) → machine/font difference or stale build, not a design change. Baselines were rendered on darwin; do not re-baseline from another OS.
5. `layout.spec.ts` failures are not pixels: the assertion message lists the element, its measured size and the limit (`.container 1840px exceeds 1152px`, `brand wraps: 92px tall at font-size 28px`, `sticky element … does not fit a 768px viewport`). Fix the CSS, re-run that one test with `-g`.

## False positives seen so far (2026-11-09 to 2026-11-16) — and the pattern that avoids them

| Symptom | Cause | Pattern |
|---|---|---|
| `elementFromPoint` hit-test on the carousel arrow reported "covered by" or `null` | the arrow was probed while below the fold; `elementFromPoint` only sees the viewport | `await locator.scrollIntoViewIfNeeded()` (or `el.scrollIntoView({ block: 'center' })` inside `page.evaluate`) before reading `boundingBox()` / probing the point — see `gallery.spec.ts` and the overlay test in `layout.spec.ts` |
| "carousel changed size" after clicking next, although the box is fixed 3:2 | `boundingBox()` returns viewport-relative `x`/`y`; the click scrolled the page, so the comparison included scroll offset | compare only `{ width, height }` (`gallery.spec.ts` `size()` helper) |
| `openStable()` hung until the test timeout | `await img.decode()` on a lazy image outside the viewport never resolves because the browser never starts loading it | force `img.loading = 'eager'` only for images inside the snapshot area, `.catch(() => undefined)`, and `Promise.race` against an 8 s cap (`tests/visual/helpers.ts`) |
| Toast assertions flaky on phone projects | the language toast overlaps the submit button / arrows for de-*/en-* browser locales | pre-dismiss via `page.addInitScript(() => localStorage.setItem('fv-lang-toast-dismissed', '1'))` in every spec except `locale.spec.ts` |
| 12 contact success-path tests "skipped" | an already-running dev server was started without `VITE_FORM_ENDPOINT`; the spec detects `data-endpoint !== 'configured'` and skips | stop the dev server and let Playwright start it (the managed `webServer` sets the env), or export `VITE_FORM_ENDPOINT=https://mock-form-endpoint.test/submit` before `npm run dev` |
| WebKit: Tab does not move focus to links | Safari's "Press Tab to highlight each item" default | focus the element directly (`page.locator('.skip-link').focus()`) as `navigation.spec.ts` does |
| 12 contact failures in a sibling session's run, 3 success tests suddenly un-skipped | someone created `.env.local` with the real endpoint; Vite restarted the shared dev server and Playwright reused it | fixed for good by the auto fixture in `tests/e2e/fixtures.ts`; still announce env changes when sessions share a checkout |
| Run "passed" (exit 0) with 210 instead of 280 | the command was piped through `tail`, which hid the exit code; the whole `firefox` project had failed to launch | `set -o pipefail`, or run unpiped and compare the passed total with `SKILL.md` §1 |
| An element baseline with a blank lower part that the suite defends as "approved" | `locator.toHaveScreenshot()` does not paint what lies below the viewport edge | `expectFullyInViewport(locator)` before the snapshot, taller viewport (`tests/visual/helpers.ts`) |
| "The first carousel" snapshot contains a heading | `getByRole('region').first()` matches the labelled `<section aria-labelledby>` (`AlbumSection.tsx`), not the carousel div | intended today; target `[aria-roledescription="carousel"]` only together with an approved re-baseline of both carousel PNGs |
| A scroll probe reports the wrong position | `scroll-behavior: smooth` — the programmatic scroll has not finished | real wheel/keyboard input, or disable smooth scroll first (`openStable()` injects `scroll-behavior: auto`) |
| Visual suite red with "1 passed" then `fatal: Unable to read current working directory` | the worktree was removed while the hook was running in it | not a regression; re-run in an existing checkout |
| Visual run green or red against the wrong code | `reuseExistingServer: true` picked up a preview on :4173 that another checkout started | `lsof -i :4173`, stop the foreign preview, `npm run build`, re-run |
| Curl still shows the old site after a DNS change | local DNS cache (TTL 3600) | `dig @8.8.8.8`, `curl --resolve host:443:<ip>`; test certificates with `openssl s_client -servername <host> -connect <ip>:443` and wait 5 minutes after issuance before calling it a problem |

## Firefox does not launch (macOS 27)

Symptom and fix are in `SKILL.md` §6; the proof steps, in order:

```bash
ls ~/Library/Application\ Support/Firefox          # "Operation not permitted" = this cause (sibling folder Mozilla is readable)
log show --last 1m --predicate 'process == "kernel" AND eventMessage CONTAINS "System Policy"'   # deny(1) file-read-data
# bare binary, no Playwright (<build> = 1543 for Playwright 1.63.0; older builds may sit beside it):
FF=~/Library/Caches/ms-playwright/firefox-<build>/firefox/Nightly.app/Contents/MacOS/firefox
$FF -no-remote -headless -profile <dir> -screenshot <png> about:blank                                  # fails the same way for any <dir>
CFFIXED_USER_HOME=<existing empty dir> $FF -no-remote -headless -profile <dir> -screenshot <png> about:blank   # starts
```

Tested 2026-11-16: a missing `CFFIXED_USER_HOME` folder fails, `HOME=<dir>` alone fails. Not tested: a newer Playwright/Firefox build, Linux/CI (the variable is inert outside macOS by design).

## Shell and tool traps (rtk hook, zsh, browser pane)

| Trap | Use instead |
|---|---|
| `npx <bin>` is rewritten to `npm run <bin>` | `./node_modules/.bin/<bin>` |
| `git push` / `git diff --stat` / `git status` / `git log` output is compressed or reformatted; a script parsing it gets `---` and `Changes` tokens | `rtk proxy git …` for anything parsed or used as evidence |
| `grep`, `ls` output rewritten into a summary | `/usr/bin/grep`, `/bin/ls`, or `rtk proxy` |
| zsh: unquoted globs fail (`--include=*.tsx`), `g` is an alias, there is no `PIPESTATUS` | quote the pattern; `cmd; echo $?` or `pipestatus` |
| `cd` inside a command changes the cwd for the rest of the session | absolute paths |
| Filtering a diff with `grep -v "^[-+][-+]"` hides every `BACKLOG.md` line (they start with `- [`) | print diff lines with python or `grep -E "^(@@\|\+- \|-- \[)"` |
| Auto-mode review rejects a Bash call the hook rewrote after review | one command per call, or re-issue it verbatim once |
| Browser pane: `read_network_requests` does not list cross-origin `fetch` calls | `performance.getEntriesByType('resource')` and read `responseStatus`; the success state alone also proves `res.ok` |
| Browser pane: `file://` pages cannot load local images; `read_page` is empty while the pane is hidden; a mobile viewport stays until reset | serve over HTTP (`.claude/launch.json`), use `find` / JS, reset to desktop afterwards |
| `preview_start` moved the port because 4173/4174 were taken by a sibling session | read the port from the tool result, never assume the configured one |
| No `gh` CLI on this machine | Push, hand over the compare link and a drafted PR body; open PRs can be listed with `curl https://api.github.com/repos/sebokgabor84/fiorevera/pulls?state=open` (public repo) |
| Vendor pages (web3forms.com) answer 403 to a plain fetch | read them through the Browser pane |
| A probe script in the scratchpad cannot resolve `@playwright/test` or `sharp` | import by absolute path from the repo's `node_modules` (e.g. `<repo>/node_modules/sharp/lib/index.js`) |

## Unit-test gotchas
- `render.test.tsx` runs in jsdom but renders through `renderToString`; a component that reads `window`, `localStorage`, `Intl` or `Date` during render passes in the browser and throws here — that is the point (PRD D-18). Move it into an effect.
- `data.test.ts` imports `flatten`/`loadLocales` from `scripts/validate-i18n.ts`; a key typo in `src/data/*.ts` surfaces there as `"<key> missing in de"`, not in the Zod parse.
- `skills.test.ts` fails on any new directory under `.agent/skills/` until `src/types/skills.ts` and `AGENTS.md` are updated.
