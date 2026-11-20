# Harvest: Vera concierge → CMS Coordinator (concept only)
Session: vera-concierge (side session of the overarching session) · period: 2026-11-16–2026-11-20 · commits: none (branch `claude/vera-concierge-7826b5` = `origin/main` 4d2106f plus one untracked file)

## 1. What this session delivered
- Concept for an agent that lets Vera (and sometimes Gabor) maintain site content without git: `docs/vera-agent/PRD.md` (untracked, ~8 800 words). **Status: written, NOT approved by Gabor. Nothing was built**: no skill, no `scripts/content/`, no guide, no registry change.
- `grill-me` interview with Gabor, seven decisions G1–G7 (PRD §0) — table in section 3 below.
- Operations catalogue: 16 content operations, each with proposed script, files touched, validation, guarding tests, baselines that move, what the owner sees (PRD §3.3).
- Safety model on top of the merged `release-manager`, with one exception ("content lane") (PRD §3.4); refusal / escalation rules and a failed-gate → Hungarian sentence table (PRD §3.6); pilot task list of 8 tasks and success measures (PRD §3.7); 43 user stories (PRD §4).
- Nine scope requests R1–R9 that need Gabor's yes or no before a build (PRD §7).
- Interface request to the release manager: side-session note `vera-concierge-needs-from-release-manager.md` (outside the repo; its still-valid part is R5 below).
- Product facts checked in the official docs on 2026-11-16 and 2026-11-18 (three documentation agents): PRD §3.1 table, §5 "How it becomes a dedicated agent", §10.

## 2. Learnings (rules a future agent must follow)
- **Adding or removing an album, rental item or testimonial turns the gates red by design: tests pin today's counts.** — `tests/unit/data.test.ts:29,30,43,48,55,71` (15 albums, 169 photos, 7 items, mirror deposit 20 000, 4 testimonials), `tests/unit/render.test.tsx:42,48,49`, `tests/e2e/gallery.spec.ts:16`, `tests/e2e/rental.spec.ts` (7 items). Checked on 4d2106f, 2026-11-20. [testing] [architecture]
- **Never run `npm run optimize:assets` on a checkout without the complete `assets-src/`.** — `scripts/optimize-images.js` only checks that the root folder exists (`:179`), builds `imageMeta.ts` from the album folders it finds and deletes outputs without a source; a clone holding one new album would drop the other 15 from the manifest. `assets-src/` is git-ignored and complete only on Gabor's Mac. Read from the code, not executed. [architecture] [tooling]
- **The committed WebP files are the source of truth for existing photos; originals are a local archive.** — follows from the point above and from the repo being public (`release-manager` note, 2026-11-16): originals must not be committed. [architecture] [legal]
- **The installed sharp build cannot read iPhone HEIC.** — `sharp.format.heif.input.fileSuffix` = `[".avif"]` (measured 2026-11-16, main checkout), although `IMAGE_RE` in `optimize-images.js` lists `heic`. On macOS `/usr/bin/sips` can convert first. [tooling]
- **Pixel baselines are macOS pixels; a Linux cloud session cannot compare against them.** — `docs/qa/visual-regression-plan.md` ("platform-specific: generated on macOS"). Parity between two Macs is not measured. [testing]
- **A content change is supposed to change pixels, so the pixel gate is an approval step for content, not a regression check.** — home, gallery, rental and contact baselines contain albums, prices and copy. The owner's answer: use the code-based review page (`npm run visual:page`, `docs/qa/visual-review-process.md`), run locally, baselines stay in the repo (Gabor, 2026-11-18). [testing] [owner-preference]
- **Find the key a visible sentence comes from by rendering, not by guessing.** — an earlier edit went to `gallery.intro` instead of `gallery.hero.intro` (`.agent/harvest/main-build.md`); the concept therefore has a `text-find` helper. [workflow]
- **Claude Code discovers project skills only under `.claude/skills/`, not `.agent/skills/`.** — skills doc, 2026-11-18: "`.claude/skills/<skill-name>/SKILL.md` | Sessions in this repository". This repo's 14 skills are reached through `AGENTS.md` routing only. [tooling]
- **`"agent": "<name>"` in `.claude/settings.json` makes every session of the project run as that agent.** — sub-agents doc, 2026-11-18. In the committed file it would hijack technical sessions; per machine it belongs in the git-ignored `.claude/settings.local.json`. Whether the desktop app honours it is not documented. [tooling]
- **Vercel Hobby deploys only commits whose author has access to the Vercel project.** — vercel.com KB "why aren't commits triggering deployments": "only the account owner can trigger deployments". Holds as long as commits carry Gabor's git identity (G2). [ops]
- **Gabor often answers a multiple-choice question with free text that changes the premise; read it as new facts, then re-ask only what is still open.** — "Vera has also a mac", "she speaks fluently german and english", "a meaningful name like CMS-coordinator", 2026-11-18. [owner-preference] [workflow]
- **Gabor wants role names for agents, not human names.** — G7, 2026-11-18. [owner-preference]
- **The persona name "Vera" in `AGENTS.md` collides with the real Vera.** — 19 occurrences in `AGENTS.md` on 4d2106f mean the coordinator persona, while `BACKLOG.md` and the plans mean the person ("Vera picks the 15 album covers"). [workflow]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| G1 One dedicated agent with its own skills, in a Claude Code session, for Vera first and Gabor sometimes; visual regression runs locally, baselines in the repo, no CI in the deploy path | Gabor, 2026-11-18 | `docs/vera-agent/PRD.md` §0 | no (once the PRD is committed) |
| G1 reading: stage 1 = desktop app on a Mac, cloud = stage 2 | **my interpretation, not confirmed** | PRD §0, §9 point 8 | YES → needs Gabor's confirmation (section 6) |
| Vera has a MacBook Air M4 13" (2025) | Gabor, 2026-11-18 | PRD §0 | no |
| G2 One shared family Claude account, connected to Gabor's GitHub | Gabor, 2026-11-18 | PRD §0 | no |
| G3 The agent merges pure content after the owner's yes; everything else waits for Gabor | Gabor, 2026-11-18 | PRD §0, §3.4 | YES → `release-manager` SKILL.md still says "the agent never merges and cannot" (R5) |
| G4 Visual approval = the site-polish review page, adapted, not replaced | Gabor, 2026-11-18 | PRD §0, §3.4 | no |
| G6 Vera approves Hungarian, German and English herself (fluent in all three) | Gabor, 2026-11-18 | PRD §0 | YES → `i18n-guardian` SKILL.md and `BACKLOG.md` R-1 do not say who reviews DE/EN |
| G7 Agent name `cms-coordinator`; persona "Vera" → "the Project Coordinator" | name: Gabor, 2026-11-18; persona rename: my proposal | PRD §0, §5 | YES → `AGENTS.md` (R8, not done) |
| Visual gate for content: Gabor answered "no preference" to my first question, then gave G4 | Gabor, 2026-11-18 | PRD §0 | no |
| Content gate set (two browsers + axe, not four) | **my recommendation, not decided** | PRD §3.3, R6 | YES → decision, then `qa-specialist` |
| Claude Pro 20 USD/month covers desktop Code tab, Artifacts, Remote Control | docs, 2026-11-18 | PRD §3.1 | no |
| `gh` is not installed on Gabor's Mac | measured 2026-11-16 and 2026-11-20 | `release-manager` SKILL.md §3 step 6 | no |

## 4. Improvements NOT implemented yet
- [ ] R1 Derive the pinned content counts from the data — first new album fails otherwise — files in section 2 — adding a fixture album keeps unit and e2e green — S — y
- [ ] R2 Shared encoder module for `optimize-images.js` and a slot-scoped intake; global script refuses when `assets-src/` lacks a slot the manifest has — prevents emptying the gallery — `scripts/optimize-images.js`, `scripts/content/` — run on a clone with one album folder exits non-zero, manifest unchanged — M — y
- [ ] R3 HEIC intake through `sips` on macOS — iPhone photos — `scripts/content/` — a `.heic` fixture yields three WebP tiers ≤ 200 KB — S — y
- [ ] R4 Hungarian mode and an approver line on the review page — `scripts/visual-review-page.ts` — page renders HU labels, `--answers` reads both languages — S — y
- [ ] R5 Content lane: `release:publish-content`, guard rule against a typed `gh pr merge`, selftest case, skill section; `gh` installed — `scripts/release/`, `.claude/hooks/guard-bash.sh`, `release-manager` SKILL.md — selftest shows a `needs-gabor` diff refused — M — y
- [ ] R6 Gate set for class `content` documented in `qa-specialist` — S — y
- [ ] R7 GitHub ruleset on `main` (owner switch) — y
- [ ] R8 Persona rename in `AGENTS.md`; the two skill lines that mean the persona: `skill-creator/SKILL.md:81` ("Update Vera's registry") and `goodbye/SKILL.md:7` ("Runs Vera's session-close checklist") — S — y
- [ ] R9 `.claude/agents/cms-coordinator.md` and a pointer skill `.claude/skills/cms-coordinator/SKILL.md` — S — y
- [ ] The whole foundation: `cms-coordinator` skill, `scripts/content/*` with unit tests (`classify`, `doctor`, `gates`, data editors, locale editor, `text-find`, image intake, 16 operations), `docs/vera-agent/utmutato.md` (Hungarian one-page guide), `docs/vera-agent/changelog.md`, registry (`AGENTS.md`, `CLAUDE.md`, `src/types/skills.ts`) — PRD §3.7 stage 0 — L — y (PRD approval)
- [ ] "Before = `main` built on the same machine" for the review page (baseline folder from an environment variable in `playwright.visual.config.ts`) — needed for cloud sessions and if two Macs render differently — M — y
- [ ] Announcement strip / opening information: no data model and no component exist — a feature for Gabor (PRD §8) — M — y
- [ ] The PRD itself has three lines that went stale between 2026-11-18 and 2026-11-20 and should be corrected when it is next edited: §10 last row (`CLAUDE.md` project state is up to date on 4d2106f: "as of 2026-11-16"); §7 R4 and §5 call the review page "site-polish branch, not merged yet" (`scripts/visual-review-page.ts` is on `main`); §7 R1 lists `tests/e2e/rental.spec.ts` correctly but R8 says "two lines in other skills that say Vera's registry" (it is one such line plus `goodbye/SKILL.md:7`) — S — n
- [ ] `.agent/hooks.json` is an Antigravity file Claude Code does not read; `.claude/hooks/session-start.sh` now does that job — decide whether to keep it — S — y

## 5. Skill updates needed
- `.agent/skills/release-manager/SKILL.md`: add the content-lane exception if R5 is accepted; today §3 step 7 and the description contradict G3.
- `.agent/skills/i18n-guardian/SKILL.md`: say that Vera approves DE and EN herself (G6); §7 still lists the HU te/ti register as open.
- `.agent/skills/design-system-expert/SKILL.md` §4: "drop the original into `assets-src/<slot>/`, run `npm run optimize:assets`" is unsafe on a machine without the full originals; point to the slot-scoped intake once it exists.
- `.agent/skills/qa-specialist/SKILL.md`: gate set for class `content` (R6); note that content counts are pinned until R1.
- `.agent/skills/skill-creator/SKILL.md:81` and `.agent/skills/goodbye/SKILL.md:7`: "Vera's registry" / "Vera's session-close checklist" mean the persona (R8).
- New: `.agent/skills/cms-coordinator/SKILL.md` does not exist yet.

## 6. Open owner decisions / things only Gabor or Vera can do
- **Approve or change the PRD** — asked 2026-11-18, no answer yet. Nothing may be built before it.
- **Confirm the channel reading** (G1): "we still stay with claude session approach" was typed after "Vera has also a mac". I read it as Mac first, cloud second. If cloud from day one was meant, the first deliverable becomes the "Before = `main`" adaptation. Recommendation: Mac first.
- **Photo fallback for cloud sessions** — my interview question 5 was never answered (a message about the visual gate arrived instead). Only matters for stage 2. Options: shared cloud folder (recommended), photo jobs on the Mac, photos through Gabor.
- **R1–R9**, each yes or no. R1, R2 and R5 are prerequisites for the first real album.
- **Gate set for content** (R6): two browsers plus axe (recommended) or all four.
- **Escalation channel**: the PRD proposes a message Vera forwards to Gabor, because with the shared account GitHub does not notify him. Not asked in the interview.
- **Gabor, by hand**: family Claude account; on Vera's Mac the app, Git, Node 22, clone, `npm ci`, `gh` signed in; the `main` ruleset on GitHub; then `npm run test:visual` on an untouched `main` on her Mac (first pilot measurement).
- **Vera**: the 15 covers, copy sign-off page by page, hero photo, HU te/ti, emoji in the rental steps, portrait crops. The pilot (PRD §3.7) is built around these.

## 7. Friction (what cost time and how to avoid it next time)
- The decisive fact arrived at question 5 of the interview (Vera owns a Mac), after "cloud" had been chosen and three follow-up questions built on it. → Ask for the person's devices, languages and accounts as plain facts before the first design question.
- The owner clicked an answer by mistake and an interrupted dialog lost the question. → Restate the question in the chat text as well, not only in the dialog.
- The owner's reply to one dialog ("the visual regression will run locally…") answered the previous question. → When a free-text reply does not fit the open question, say which question it was taken as.
- The brief limited the branch to six paths; the concept needs nine changes outside them. → Read the tests and scripts the feature depends on before agreeing scope limits; list the out-of-scope needs in the plan, never work around them.
- `main` moved three times during the concept (quality gates, release manager, site polish), and the release-manager interface I drafted on day one was stale two days later. → For a concept that builds on a sibling's unmerged work, read the sibling's note and worktree again right before writing, and date every "as of".
- The rtk hook rewrote compound `cat` commands and the auto-mode classifier then refused them; a `cd` into another folder changed the session's working directory. → Use the Read tool or `rtk proxy cat` for multi-file reads; never `cd` out of the worktree in a shell call.
- Three documentation agents were needed because the first answers left "not documented" gaps that mattered (default agent, Remote Control photos). Two sources still disagree on whether a phone photo is saved as a file. → Treat product behaviour that the docs do not state as a pilot measurement, and write it down as such.
