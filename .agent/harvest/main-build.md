# Harvest: main build session (site build, QA, visual gate, coordination of the sub chats)
Session: main · period: 2026-11-09–2026-11-16 · commits on main: `1ca5d84`, `ff65def`, `697cc81`, `76eaed2`, `05eef52`, `410c6d0` (via PR 6), plus the branch cleanup on 2026-11-16

## 1. What this session delivered
- First build pass, owner feedback round, QA session (0 blockers, 13 majors, ~55 minors) — `docs/qa/2026-11-09-qa-session.md`
- All 13 QA majors fixed — `697cc81`
- Visual regression gate: `playwright.visual.config.ts`, `tests/visual/{layout,snapshots}.spec.ts`, `tests/visual/helpers.ts`, `.githooks/pre-commit`, `.githooks/pre-push`, `scripts/visual-approve.mjs`, `docs/qa/visual-regression-plan.md`, `docs/qa/visual-baselines-log.md`
- Language toast: one layout at every width + toast-visible baselines — `410c6d0`
- Build documentation artifact: https://claude.ai/artifact/NEGzVfsqWnoLn2zpd9cDrj (not updated since 2026-11-09)
- Five sub chats started and coordinated (contact form, baseline review, favicon, GDPR, domain move); repo cleaned to `main` only on 2026-11-16

## 2. Learnings
- **`backdrop-filter` on an element makes it the containing block for `position: fixed` descendants** — the mobile menu rendered under page content; glass now sits on `.header::before` (`src/components/Layout/header.module.css`). [architecture]
- **A width cap on `.container` must be re-checked against the header** — the M1 container fix wrapped the wordmark at ≥ 1280 px; the header bar has its own `90rem` cap and a non-shrinking logo. This regression is why the visual gate exists. [design][testing]
- **No sticky columns below 48rem** — on phones the About text scrolled behind the sticky image ("critical UX bug", owner). `src/pages/pages.module.css`. [design]
- **One layout per component unless a breakpoint is unavoidable** — owner on the toast: "simplify the implementation, to not depend on device". [owner-preference]
- **Contrast failures are a hard no-go; always-on glass header was chosen over scroll-dependent styling.** [owner-preference][a11y]
- **Carousel: arrows always rendered, also on phones, on top of the image, constant box size, nothing jumps; "do not overcomplicate".** [owner-preference]
- **Never put pseudo-comment keys into `vercel.json`** — `_comment_404` passed locally and was rejected by Vercel's import validator on launch day (fixed in `dcd491e`). Put explanations in `docs/`. [ops]
- **Vercel 404s need no catch-all rewrite** — a single `dist/404.html` (empty root, noindex) served natively with HTTP 404; the client renders the localized page. [architecture][seo]
- **Declare `useCallback`s above the effects that use them** — TDZ error broke `tsc` and left a stale `dist/`; after a failed build always `rm -rf dist dist-ssr` before trusting it. [tooling]
- **Lazy images make `img.decode()` hang in tests** — force `loading = 'eager'` for images inside the snapshot area, race with a timeout (`tests/visual/helpers.ts`). [testing]
- **`scroll-behavior: smooth` makes programmatic scroll probes lie** — verify scrolling with real wheel or keyboard input. [testing]
- **Lighthouse mobile (Moto G, DPR 1.75) picks the 800w image** — adding a 1280 tier does not move the lab LCP; fonts and JS do. [seo]
- **Check which i18n key a component reads before editing copy** — an intro edit went to `gallery.intro` instead of `gallery.hero.intro`. [workflow]
- **Count files with `ls`, never from memory** — the baseline count was reported as 27 when it was 25. [workflow]
- **The rtk hook rewrites `npx` and reformats `git` output** — `git log`/`git rev-parse` output was truncated or wrong on 2026-11-16 (it showed a stale `origin/main` tip). For anything that decides a delete or a merge use `rtk proxy git …`; for binaries use `./node_modules/.bin/<bin>`. [tooling]
- **No `gh` CLI; open pull requests can still be listed** with `curl https://api.github.com/repos/sebokgabor84/fiorevera/pulls?state=open` (public repo). [tooling]
- **"Sub chat" means a real side session** (`start_session`), not an inline answer. [owner-preference]
- **When the owner chains instructions ("update the artifact, push, compact") execute every one or say which could not be done** — one was silently dropped and had to be asked for again. [workflow]
- **Side sessions that share one checkout share its `.env.local`, its dev server and its branch** — a session's `.env.local` reached the running dev server and broke another session's e2e run; sessions also pushed on their own after the owner's GO in their chat. Code-writing sessions get their own worktree from now on. [workflow]
- **Re-baselining goes only through `npm run test:visual:update -- --approved-by=…`** and only after the owner saw the diff. [testing]
- **The pre-push hook runs the full gate even when the push only deletes branches** (several minutes). [tooling]
- **The handover note went stale for a week** because sessions ended on "we pause" without the goodbye ritual; the committed `.agent/last-session-handover.md` still describes 2026-11-09. [workflow]

## 3. Facts and decisions
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| Always-glass header (option A) | owner, 2026-11-09 | `header.module.css` | rationale only in chat → `design-system-expert` |
| Toast bottom-anchored, one layout, hidden while menu open | owner, 2026-11-09 | `language-toast.module.css` | no |
| Rental step 2 carries Vera's phone via `{{phone}}` | owner, 2026-11-09 | locale files, `RentalPage.tsx` | no |
| Visual baselines need owner approval by name | owner, 2026-11-09 | `docs/qa/visual-baselines-log.md`, `AGENTS.md` POST rules | no |
| Repo has only `main`; `main` deploys production on Vercel | owner merged PR 5 and 6, 2026-11-16 | launch doc | YES → `AGENTS.md` release protocol must say "never commit on main" |
| Skip link lives in `Layout.tsx`, not `index.html` | fix M4, 2026-11-09 | code | YES → `CLAUDE.md` still says `index.html` ships it |
| Unit test count | — | — | YES → `CLAUDE.md` says 54, the suite has grown (73+) |
| Project state "Vercel not set up yet", "as of first build pass" | — | — | YES → `CLAUDE.md` project state and `README.md` iteration table are pre-launch |

## 4. Improvements NOT implemented yet
- [ ] axe as a hard gate inside the visual or e2e run (MASTER-PLAN 3.1) — M — no owner decision
- [ ] Font subsetting for mobile LCP (four font preloads dominate) — M — no
- [ ] DE/EN inner-page pixel baselines after copy sign-off — S — needs sign-off first
- [ ] Baselines recorded in a container so they are not bound to one Mac — M — no
- [ ] ~55 QA minors in `docs/qa/2026-11-09-qa-session.md` (i18n voice, `_one` plurals, dead keys, tel links in rental copy, `scroll-snap-stop`, scroll-to-top over the carousel arrow, double deep-link offset, form accessible name, date `min`, six simultaneous alerts) — L — several need owner decisions
- [ ] Pre-push hook: skip the gates when the push contains only ref deletions — S — no
- [ ] `scripts/lockscreen/designs.ts` stale comment; prose widths — S — no
- [ ] Refresh `CLAUDE.md` project state, test counts, skip-link note; refresh `README.md` iteration table — S — no
- [ ] Update the build documentation artifact for the post-launch state — S — owner wants it?
- [ ] A session-end hook or reminder so "we pause" always triggers the goodbye ritual — S — no

## 5. Skill updates needed
- `goodbye`: add "harvest from side sessions" and "delete/archive finished side sessions" steps; add the stale-handover check
- `qa-specialist`: rtk/git caveat, eager-image rule, the review flow as it was actually used
- `design-system-expert`: header/toast/carousel owner decisions with their reasons
- `seo-expert`: Vercel 404 pattern, no pseudo keys in `vercel.json`, Lighthouse DPR note

## 6. Open owner decisions
- HU/DE address voice (singular vs plural, du vs ihr), hyphenation policy, emoji in rental copy, portrait crops in the 3:2 carousel (QA report § "Owner decisions needed")
- Vera's 15 cover picks (MASTER-PLAN 1.3) and copy sign-off per locale (R-1)

## 7. Friction
- Long single session with many side sessions → context compaction dropped chained instructions → run the goodbye ritual at every pause, keep one overarching session that only coordinates.
- Shared checkout between writers → use worktrees for every code-writing session.
- rtk output rewriting during verification → `rtk proxy` for git facts that gate destructive actions.
