# Harvest: Firefox e2e launch failure on macOS 27
Session: firefox-e2e · period: 2026-11-16–2026-11-16 · commits: `d6846bb` (fix), `86c1af1` (merge of main into the branch), `676f62b` (merge of pull request 5 into main)

## 1. What this session delivered
- Root cause of the Firefox launch failure, proven with the bare browser binary (no Playwright involved).
- Fix: the `firefox` project launches with a private CoreFoundation home — `playwright.config.ts:1-15` (comment + folder), `playwright.config.ts:39` (`launchOptions.env`) / commit `d6846bb`.
- Full gate on the fix: e2e 280 passed, 4 skipped in all four projects (run twice: on the branch and again after the rebase onto main); lint 0 issues; unit 77 passed; build 21 pages + 404; visual 109 passed, baselines unchanged.
- The contact-form fix `19f4b14` (same content as `a22e629`) is now verified on Firefox too: the full run included `tests/e2e/contact.spec.ts` in the `firefox` project.
- No package change, nothing downloaded. Playwright stays at 1.63.0, Firefox build `firefox-1543` (Firefox 155.0).

## 2. Learnings (rules a future agent must follow)
- **"Could not find profile folder." from Playwright's Firefox means the browser could not read the INSTALLED Firefox's data folder, not that the `-profile` path is wrong.** The test browser reads `~/Library/Application Support/Firefox/profiles.ini` at startup; macOS 27.2.1 denies that read. Evidence: kernel log `System Policy: ls(73877) deny(1) file-read-data /Users/…/Library/Application Support/Firefox` (2026-11-16 09:05); `ls` on the folder returns "Operation not permitted" although it is owner `drwx------`, no ACL, no flags; the sibling folder `…/Application Support/Mozilla` is readable. [testing] [tooling]
- **Reproduce a browser launch failure with the bare binary before touching Playwright.** `…/firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile <dir> -screenshot <png> about:blank` failed identically for an absolute path, a relative path, a path in `$HOME` and a not-yet-existing path — that ruled out the temp dir, the sandbox and the test config in one step. [testing]
- **Do not upgrade Playwright as a first reflex for a launch failure.** The task brief assumed an upgrade (1.63.0 → 1.65.1) plus a browser download; the cause was an OS access rule that any Firefox build reading the same folder would hit. The fix needed no download. Not proven: that 1.65.1 fails the same way (never installed). [workflow] [tooling]
- **`CFFIXED_USER_HOME` must point at an EXISTING folder, and `HOME` alone is not enough.** Tested on 2026-11-16: `CFFIXED_USER_HOME=<existing empty dir>` → starts and writes the screenshot; `CFFIXED_USER_HOME=<missing dir>` → same failure; `HOME=<dir>` only → same failure. Hence the `mkdirSync(..., { recursive: true })` at `playwright.config.ts:15`. [testing]
- **`launchOptions.env` replaces the whole environment; always spread `process.env`.** Playwright's `env` defaults to `process.env` only when the option is absent (`node_modules/playwright-core/types/types.d.ts`, `env?: { [key: string]: string|undefined }`). `playwright.config.ts:39` spreads it. [testing]
- **Keep the override on the `firefox` project only.** Setting `CFFIXED_USER_HOME` process-wide would also move the home of WebKit (CoreFoundation-based) and of the Vite dev server; the visual suite is chromium-only and is not affected either way. [architecture] [testing]
- **A session that must not switch the shared checkout's branch still can work on its own branch: use `git worktree add .claude/worktrees/<name> -b feature/<name> <base>` and symlink `node_modules`.** The owner asked mid-task for a separate branch while the brief forbade switching branches. All gates (lint, unit, 4-browser e2e, build, visual) ran green in that worktree with `ln -s ../../../node_modules`; no `npm install` needed. [workflow]
- **A feature branch cut before a `vercel.json` fix fails Vercel's preview check even if it does not touch `vercel.json`.** The branch was cut from `a22e629`, before `dcd491e` removed `_comment_404`; Vercel reported "should NOT have additional property `_comment_404`" on the pull request. Bring the branch up to date with main before opening the pull request. [ops] [workflow]
- **Do not rebase and force-push a branch whose pull request the owner may be merging.** The owner merged pull request 5 (taking `86c1af1`) while the rebase was being pushed; the force-push landed afterwards as a duplicate commit `5b96271` on an already-merged branch. No damage (trees identical to main), but main's history carries the extra merge commit. Ask "is the pull request still open?" right before a force-push. [workflow]
- **The pre-push hook runs the full gate even for `git push --delete`.** `.githooks/pre-push` has no check for deletions; a remote branch delete triggered lint → unit → build → visual. [tooling]
- **Never remove a worktree while another session may be running gates in it.** At 10:38–10:39 the shared checkout was switched to main and the worktrees removed while this session's pre-push hook was running the visual suite inside `.claude/worktrees/firefox-e2e-launch`; the suite failed on missing files ("1 passed", then `fatal: Unable to read current working directory`). Those red results were an artefact, not a regression. Check `list_sessions`/ask before removing a sibling's worktree. [workflow]
- **Visual runs reuse whatever already listens on :4173 (`reuseExistingServer: true`, `playwright.visual.config.ts`).** With several sessions on one machine the suite may test another checkout's build without saying so. On 2026-11-16 a preview (pid 98987) and a dev server (pid 95523) from the shared checkout were live while the worktree gates ran. [testing]
- **The `rtk` hook rewrites commands and hides detail.** `rtk git push` printed only `ok <branch>`, `rtk git diff --stat` printed blank lines, `grep` was rewritten into a summary; use `rtk proxy git …` and `/usr/bin/grep`, `/bin/ls` when the exact output matters. Calls rewritten after the auto-mode review had to be re-issued once. [tooling]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| Firefox e2e launches with `CFFIXED_USER_HOME` = `<os.tmpdir()>/fiorevera-playwright-firefox-home` | this session, owner GO 2026-11-16 | `playwright.config.ts:6-15, 36-40` | no |
| Cause: macOS 27 "System Policy" denies reads of `~/Library/Application Support/Firefox` | this session, 2026-11-16 | comment at `playwright.config.ts:6-13`; commit message of `d6846bb` | YES → one line in `.agent/memory.md` and the "how to recognise it" note in `qa-specialist` |
| e2e result is 280 passed, 4 skipped (4 projects) | measured 2026-11-16, twice | nowhere current | YES → `BACKLOG.md:23` and `.agent/skills/qa-specialist/SKILL.md:25` still say 260 passed / 16 skipped |
| Unit result is 77 passed (11 files) | measured 2026-11-16 | nowhere current | YES → `CLAUDE.md` still says "vitest (54 tests …)" |
| Fix went in on its own branch, not `feature/site-build` | owner, 2026-11-16 ("make sure this is a separate feature branch") | pull request 5, merge `676f62b` | no |
| Pre-push gates were NOT bypassed for the branch delete | owner said "Yes, skip gates", but the remote branch was already gone | — | no (nothing to record in the pull request) |
| Playwright 1.63.0 kept; latest published on 2026-11-16 is 1.65.1 | this session | `package.json` (`^1.57.0`), `package-lock.json` | no |

## 4. Improvements NOT implemented yet
- [ ] Update the stale e2e counts (260 passed, 16 skipped → 280 passed, 4 skipped) — docs contradict the code — `BACKLOG.md:23`, `.agent/skills/qa-specialist/SKILL.md:25` — acceptance: numbers match a fresh `npm run test:e2e` — S — owner decision: n
- [ ] Update the unit-test count in `CLAUDE.md` (54 → 77) — same drift — `CLAUDE.md` "Stack & commands" — acceptance: matches `npm test -- --run` — S — n
- [ ] Make `.githooks/pre-push` skip the gates when every pushed ref is a deletion (read stdin: local sha all zeros) — a delete pushes no code, yet runs lint/unit/build/visual and rebuilds `dist/` — `.githooks/pre-push` — acceptance: `git push origin --delete <branch>` returns in seconds, a normal push still runs all gates — S — y (changes a gate)
- [ ] Give the visual suite its own check that the server on :4173 serves THIS checkout's `dist/` (or drop `reuseExistingServer` when a worktree is used) — a reused preview from another checkout makes green/red meaningless — `playwright.visual.config.ts` — acceptance: a run in a worktree fails loudly or starts its own server when :4173 belongs to another folder — M — y
- [ ] Same question for e2e on :5173 (`playwright.config.ts` `reuseExistingServer: !process.env.CI`) — the worktree e2e runs may have used the shared checkout's dev server; here the only diff was the config, so results hold — M — y
- [ ] Try Playwright 1.65.1 in a throw-away worktree to learn whether its Firefox build still needs the override — would tell us if the workaround can go — `package.json`, `package-lock.json` — acceptance: firefox project green without `CFFIXED_USER_HOME` → remove the override — S — y (download ~ browsers + packages needs the owner's yes)
- [ ] Verify the fix on Linux/CI once CI exists — the variable is inert there by design, never run — acceptance: `firefox` project green on a Linux runner — S — n
- [ ] The private home folder lives under the OS temp dir and is never cleaned by the repo — macOS purges it on its own; it was 0 B after a full run — no action needed unless it grows — S — n
- [ ] Old browser builds still sit in `~/Library/Caches/ms-playwright/` (`chromium-1200/1223/1248`, `firefox-1497`, `webkit-2227`, `ffmpeg-1013`) — disk space only — `npx playwright uninstall` would prune — S — y (owner's machine)
- [ ] Alternative to the workaround, not taken: grant the launching app access to other apps' data in macOS privacy settings — per machine, owner-only, and the exact settings pane on macOS 27 was not looked up — S — y

## 5. Skill updates needed
- `.agent/skills/qa-specialist/SKILL.md:25`: e2e row says "260 passed, 16 skipped", 69 tests per project; measured 280 passed, 4 skipped (71 per project).
- `.agent/skills/qa-specialist/SKILL.md`: add a "Firefox will not launch" entry — symptom `browserType.launch: Failed to launch the browser process` + `Could not find profile folder.`; check `ls ~/Library/Application\ Support/Firefox` ("Operation not permitted" = this cause) and `log show --last 1m --predicate 'process == "kernel" AND eventMessage CONTAINS "System Policy"'`; fix lives at `playwright.config.ts:6-15, 39`; do not upgrade Playwright first.
- `.agent/skills/qa-specialist/SKILL.md`: state that `launchOptions.env` must spread `process.env`, and that browser-specific env belongs on the project, not on `process.env`.
- `.agent/skills/qa-specialist/SKILL.md`: note that visual/e2e reuse servers on :4173/:5173 and what that means when several sessions or worktrees are active.
- `.agent/skills/goodbye/SKILL.md` (or `AGENTS.md` repo hygiene): before removing worktrees/branches, confirm no linked session is mid-gate in them.

## 6. Open owner decisions / things only Gabor or Vera can do
- Keep the config workaround (recommended: works for every checkout, no machine setup) or additionally grant the app access in macOS privacy settings (per machine; does not replace the workaround for other machines).
- Whether to trial Playwright 1.65.1 (needs a download approval). Recommendation: only when another reason to upgrade appears.
- Whether the pre-push hook may skip deletions (changes a gate). Recommendation: yes.

## 7. Friction (what cost time and how to avoid it next time)
- A binary `grep -o` with a 200-character context on the 161 MB `XUL` library ran past the 2-minute limit → use `grep -c -a` to locate, then reason from the source; the experiment (`CFFIXED_USER_HOME`) answered faster than reading the binary.
- The brief pre-decided the fix ("most likely a Playwright upgrade") → briefs should state the symptom and the done-criteria, and leave the cause open.
- Merge, then rebase, of the same branch within minutes, with the owner merging in between → agree on one update method (merge main in, no history rewrite) once a pull request is open.
- Worktree removed under a running hook → red visual output that looked like a regression; cost one investigation round → coordinate cleanup through the linked-sessions list.
- `rtk` output compression hid whether a push ran its hook and whether a diff was empty → `rtk proxy` for anything used as evidence.
