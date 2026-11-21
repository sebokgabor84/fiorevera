# Harvest: Vera concierge → CMS Coordinator (concept, then the foundation)
Session: vera-concierge (side session of the overarching session) · period: 2026-11-16–2026-11-21 · commits: on `claude/vera-concierge-7826b5`, pull request 22 — the concept (rebased onto `main`) and the build in three commits, pushed on 2026-11-21 after the owner's GO 1; not merged

## 1. What this session delivered
- Concept, approved by the owner on 2026-11-20 with changes — `docs/vera-agent/PRD.md` (§0: decisions G1–G14).
- Skills `cms-coordinator` (+ `resources/catalogue.md`, `resources/dialogue-hu.md`), `tech-lead`, `goodmorning` (+ `resources/sources.md`); agent definition `.claude/agents/cms-coordinator.md`; pointer skills `.claude/skills/{cms-coordinator,goodmorning}/` (slash commands). Registry: 17 skills.
- Content operations: `npm run content -- <operation>` (23 operations) — `scripts/content/cli.ts`, pure functions in `ops.ts`, one validated `ContentState` in `lib/state.ts`, byte-preserving data-file editor `lib/tsData.ts`, single-slot photo intake `lib/photos.ts` (HEIC through `sips`), classifier `lib/classify.ts`, `gates.ts`, `doctor.ts`, `morning.ts`, change log `lib/changelog.ts`.
- Shared image encoder `scripts/images/tiers.js`; `scripts/optimize-images.js` refuses (exit 2) when a rebuild would delete or reorder photos the manifest holds.
- Content lane `scripts/release/publish-content.ts` (publish, `--check`, `--handoff`, `--rollback`, `--abandon`); approver identity `scripts/release/operator.ts` (self-chosen PIN in a macOS dialog, roles, three-tries lock, start-of-day session); Bash guard rule 8 against a typed `gh pr merge`.
- Review page: `lang: "hu"`, `goLive: true` (`scripts/visual-review-page.ts`); baseline size reminder `scripts/visual-baseline-size.mjs` (`npm run visual:size`, printed by `test:visual:update`).
- Decision log `docs/decisions/0001`–`0005`; owner's guide `docs/vera-agent/utmutato.md`; session-start hook prints who is at the keyboard today.
- Documentation made template-grade (owner's request 2026-11-21): root `README.md` rewritten as a project README, the historical plan moved unchanged to `docs/history/project-plan-2026.md`, the framework / site inventory for the template session in `docs/template/README.md`, and `tests/unit/docs.test.ts` as the gate against dead documentation.
- Tests: unit 147 → 257 in 24 files (`content.test.ts` 61, `contentLane.test.ts` 24, `operator.test.ts` 13, `docs.test.ts` 4, `visualBaselineSize.test.ts` 4, `visualReview.test.ts` +4); content counts in `data.test.ts`, `render.test.tsx`, `gallery.spec.ts`, `rental.spec.ts` derived from the data.
- Gates on 2026-11-21: lint + script type check clean, unit 257, e2e 413 passed / 7 skipped, build 21 pages, visual 110, release selftest 81.

## 2. Learnings (rules a future agent must follow)
- **Edit a data file by cutting and pasting between parser positions, never by reformatting it.** — `src/data/*.ts` are not prettier-formatted (150-character lines); a formatter would rewrite every line. `lib/tsData.ts` keeps untouched entries byte for byte; the test "writing back unchanged values reproduces the file" guards it. [architecture]
- **The locale files write no-break spaces as ` ` escapes; `JSON.stringify` does not.** — a plain round trip changed 9 lines per file; `renderLocale` re-escapes invisible characters. [tooling]
- **Compare a file with git only through a call that does not trim.** — the shared `git()` helper strips trailing whitespace; `git show` content without its last newline made every data file look "changed outside its entries". Found by a test on a throw-away repository, not by the in-memory tests (`gitFile`). [testing]
- **A change that is made and undone still moves the sitemap dates.** — `scripts/sitemap-lastmod.json` got today's date after a price went up and back; an unreleased change is therefore dropped with `--abandon`, never by switching branches (uncommitted files travel along). [workflow]
- **A test or script that starts git inside a hook acts on the hook's repository unless git's variables are removed.** — the pre-push hook ran the unit suite with `GIT_DIR` set; five new tests did `git init` in a temporary folder and re-initialised the shared repository as bare (`core.bare = true` in the common `.git/config`, every worktree answered "must be run in a work tree"). Caught by the hook refusing the push; repaired with `git config --file <common>/config core.bare false`; fixed with `repoEnv()` in `scripts/content/lib/checkout.ts` for every spawned git and a regression test; proven by running the suite with `GIT_DIR` on a decoy repository. Plain `npm test` never shows this. [testing] [tooling]
- **The picture check differing is the expected result of a content change** — `content:gates` reports it as `review`, a layout failure as `fail`. [testing]
- **A saved gate result is not proof.** — the first lane trusted `.content/gates.json`; the owner asked for strong rules, so the lane now runs every gate itself and the file only serves `--check`. [architecture] [owner-preference]
- **An approval the agent can type is not an approval.** — review answers are pasted text and `--approved-by` was a flag; the owner added a PIN typed into a system dialog as the last line. The agent never asks for, sees or stores it. [owner-preference] [architecture]
- **A four-digit PIN checked on the agent's own machine identifies, it does not defend.** — hash and lock live in a file the agent's user can read; said to the owner, who chose it knowingly ("PIN now, GitHub later"). [architecture]
- **GitHub cannot tell the owners apart while they share one account**; "content only" and "approved by Vera" exist only in the script until separate accounts and a code-owners rule exist. [ops]
- **A ruleset that is "Disabled" or has no target protects nothing.** — the owner's first save showed both; check with `curl https://api.github.com/repos/<slug>/rules/branches/main` (2026-11-21: three rules). [ops]
- **Owner preferences confirmed:** role names for agents; the smaller option first; a phone-style PIN he defines himself; "ask me at the beginning of the day who I am"; the README files and Vera's guide are updated in the same change as the code. [owner-preference]
- **Start-of-session routines in the widely used agent repositories** share: a tiny hook, one explicit command, read the handover completely and verify it, one next step, a bounded report, ask before acting; none asks who the human is — `.agent/skills/goodmorning/resources/sources.md`. [workflow]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| G1–G7 (agent, shared account, content lane, review page, DE/EN by Vera, role names) | Gabor, 2026-11-18 | `docs/vera-agent/PRD.md` §0, `docs/decisions/0001`–`0004` | no |
| G8 Mac first, no cloud for now; G9 `tech-lead` in scope; G10 baseline growth accepted, reminder in code; G11 R1–R9 yes | Gabor, 2026-11-20 | PRD §0, `BACKLOG.md` | no |
| G12 rules must be strong: ruleset active, lane runs its own gates | Gabor, 2026-11-21 | PRD §0, `release-manager` §9 | no |
| G13 identity: question at the start of the day, PIN as the last line; four-digit, self-chosen; GitHub accounts later | Gabor, 2026-11-21 | `docs/decisions/0005`, `scripts/release/operator.ts` | no |
| G14 `/goodmorning` shaped after public best practice | Gabor, 2026-11-21 | `.agent/skills/goodmorning/` | no |
| Ruleset "main branch protection": active, target `main`, pull request required, no force push, no deletion, empty bypass list | Gabor, 2026-11-21 (GitHub settings) | `docs/decisions/0005`, `docs/ci/README.md` | no |
| Budgets: baseline set 15 MB, history 100 MB (the second number is this session's choice) | session, 2026-11-21 | `scripts/visual-baseline-size.mjs`, `docs/decisions/0003` | no |
| Content gates: e2e on chromium + Mobile Chrome with axe (this session's recommendation, built) | session, 2026-11-21 | `scripts/content/gates.ts`, `qa-specialist` | owner has not said yes to this point by itself |

## 4. Improvements NOT implemented yet
- [ ] First real run of the content lane (commit, push, `gh pr create`, `gh pr merge`, Vercel status, `verify:live`, branch removal): never executed, `gh` is not installed on the build machine — supervised, on one rental price — S — y
- [/] The PIN dialog on a real screen: the owner set his own PIN through it on 2026-11-21 (`npm run release:operator -- --set gabor …` answered `ok`). Still unseen in real use: a PIN being asked for and checked (`--verify`, a release), the lock after three wrong entries, Vera's set-up — S — y
- [ ] Separate GitHub accounts + code-owners rule (the strong identity stage); before it, test a second account's merge on Vercel Hobby — M — y
- [ ] "Before = `main` built on the same machine" for the review page, if two Macs render differently or the cloud is taken up — M — y
- [ ] Baseline maintenance (prune history or Git LFS) when `npm run visual:size` says "getting full" — M — y
- [ ] Review page: plain screen names in Hungarian instead of `rental-1280` — S — n
- [ ] With CI as a required check the lane must wait for it before merging — `docs/ci/README.md` — S — y
- [ ] Announcement strip, opening hours, hero/About photo operation: not content yet — M — y
- [ ] `.agent/hooks.json` (Antigravity) is unused by Claude Code — S — y

## 5. Skill updates needed
- None open from this session: `release-manager` (§9), `qa-specialist`, `i18n-guardian`, `design-system-expert`, `skill-creator`, `goodbye` were updated in the same change. After the pilot: every dialogue misstep becomes a model sentence in `cms-coordinator/resources/dialogue-hu.md`.

## 6. Open owner decisions / things only Gabor or Vera can do
- GO 2: merge pull request 22 on GitHub (GO 1 was given on 2026-11-21).
- On each Mac, once: `brew install gh` (done on Gabor's Mac 2026-11-21), `gh auth login` (started, not finished); `npm run release:operator -- --set gabor --role admin --name "Gábor"` (done on Gabor's Mac 2026-11-21), then `-- --set vera --role content --name "Vera"` (each types their own PIN); on Vera's Mac `"agent": "cms-coordinator"` and `"env": { "FV_OPERATOR": "vera" }` in the git-ignored `.claude/settings.local.json`.
- The pilot (PRD §3.7): first `npm run test:visual` on an untouched `main` on Vera's Mac, then the eight tasks.
- Say so if any of R1–R9, the two-browser content gates or the 100 MB history budget was not meant as a yes.

## 7. Friction (what cost time and how to avoid it next time)
- Vera's Mac came up at question 5 of the interview, after "cloud" had been chosen → ask for devices, languages and accounts as plain facts before the first design question.
- Three owner messages arrived mid-build and each changed the design (PIN length, PIN position, morning routine) → build the smallest slice, show it, then extend; do not finish a design the owner has not seen.
- The auto-mode check failed several times on large writes and on commands the rtk hook rewrote → retry once as instructed; keep shell commands free of `ls`/`cat` that the hook rewrites, or use `rtk proxy`.
- My own rehearsal left bumped sitemap dates and a failing unit test → rehearse on a throw-away copy, or restore generated files right after.
- A `cd` inside a shell call moved the session's working directory → never `cd` out of the worktree.
