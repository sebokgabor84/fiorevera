---
name: goodbye
description: >-
  Session-close ritual and self-learning engine for the Fiore Vera project. Use
  when the user says /goodbye, "goodbye", "closing the session", "wrap up",
  "we pause", "let's pause", "stop here for today", or before ending or pausing
  any working session in this repo. Runs the Project Coordinator's session-close checklist, checks
  the handover for staleness, harvests the side sessions, extracts session
  learnings, syncs memory & BACKLOG.md, audits git state (branches, worktrees,
  pull requests), and reports the handover so the next session can pick up
  cleanly.
---

# Goodbye — Fiore Vera Session Close & Self-Learning Ritual

Close the working session cleanly, extract session learnings, update project memory, and leave the repository in a deterministic, fully recoverable state.

**A pause is a session end.** "We pause", "let's continue tomorrow", "stop here" trigger this ritual exactly like "goodbye". In the week of 2026-11-09 the sessions ended on "we pause" without it, and `.agent/last-session-handover.md` described a state that was seven days and a launch out of date.

---

## Session-Close & Self-Learning Checklist

Run these steps in order, then report the results as a table (see below).

```
0. Stale-handover check (first, before anything is rewritten):
   - /usr/bin/grep -m1 "Last Updated" .agent/last-session-handover.md
   - rtk proxy git log -1 --format='%cs %h %s'                                  → last commit on this branch
   - rtk proxy git log -1 --format='%cs %h' origin/main                         → last commit on main
   - Compare the dates and SAY SO: "handover dated <date>, last commit <date> → fresh / N days stale"
   - If stale: do not trust its "next actions"; rebuild the picture from git log, BACKLOG.md
     and .agent/harvest/ before writing the new note

1. DoD pipeline — the same list as CLAUDE.md "Definition of Done", in this order, stop on first failure:
   - npm run lint        → must be 0 errors AND 0 warnings
   - npm test -- --run   → must be all green
   - npm run test:e2e    → must all pass (4 browsers; specs import from tests/e2e/fixtures.ts)
   - npm run build       → prerender must succeed
   - npm run test:visual → layout invariants + pixel baselines vs the production build
   - npm run audit:gdpr  → 0 undeclared data sinks
   Run them unpiped (a "| tail" hides the exit code; zsh has no PIPESTATUS) and compare the passed
   totals with the last recorded ones. Fix the code, not the test; never re-baseline to get green.
   A step that is not run is reported as "skipped — <reason>", never left out.

2. Git state audit — always through `rtk proxy git …` (the rtk hook reformats and truncates git output):
   - rtk proxy git fetch --prune origin
   - rtk proxy git status -sb                     → clean / dirty / staged, ahead / behind
   - rtk proxy git log --oneline origin/main..HEAD → what a push of this branch would carry
   - rtk proxy git branch -vv                     → every local branch and its upstream
   - rtk proxy git branch --merged origin/main    → merged-but-undeleted local branches
   - rtk proxy git branch -r --merged origin/main → merged-but-undeleted remote branches
   - rtk proxy git worktree list                  → leftover worktrees
   - curl -s "https://api.github.com/repos/sebokgabor84/fiorevera/pulls?state=open"   → open pull requests (no gh CLI; keep the quotes in zsh)
   - If dirty: ask the user whether to commit on the branch or leave as-is. Never stash: the stash is
     shared by every worktree and session
   - List merged branches, leftover worktrees and open pull requests in the report; delete nothing
     without the owner's yes. A branch with no commits of its own also shows as "merged" — check
     whether a live sub chat owns it. Never remove a worktree or branch while its session may be
     running gates in it.

3. Side-session harvest (whenever sub chats ran during this session):
   - Every sub chat writes .agent/harvest/<name>.md in the format of .agent/harvest/README.md
     BEFORE it is archived or deleted (its notes otherwise live outside the repo and die with the chat)
   - The coordinating session consolidates the notes: learnings → .agent/memory.md, skill gaps → the
     skills, open work → BACKLOG.md, facts marked "Missing?" → CLAUDE.md / README.md / AGENTS.md / docs/
   - Only then remove the finished chats, their worktrees and their merged branches (owner's yes);
     the harvest files stay in the repo as the raw record
   - Kept sub chats are listed in the handover with branch, worktree and scope

4. BACKLOG.md sync — MANDATORY at every close and every pause, never "skipped" (owner, 2026-11-20):
   - npm run release:status                     → its BACKLOG.md lines are the drift report: pull requests
     merged since the file last changed on main, and "In flight" rows whose branch is gone or merged
   - For every pull request merged since the last close (rtk proxy git log --first-parent --merges
     origin/main): find the lines it closes and mark them [x] with the date and the pull request number.
     Close the twin too: an item under "Harvest" often has a second line under "Owner decisions"
   - Rewrite the "In flight" table from `git worktree list` and the open pull requests, with today's
     date in its heading; a merged branch leaves the table
   - Every item in section 4 and section 6 of a harvest note written this session has a line
     (append as [ ]; owner decisions as **[OWNER]** under "Owner decisions")
   - Append emergent ideas as [ ]; note in-progress items [/] in the handover
   - Done when `npm run release:status` prints the BACKLOG.md line without a ⚠, or each remaining ⚠ is
     explained in the report (a merge that closed no item is a valid explanation — say which)
   - The edit lands like any other: on the close branch, through a pull request (step 9)

5. README.md & AGENTS.md freshness:
   - Confirm "Current iteration" matches actual state
   - Resolve open questions in AGENTS.md if answered this session
   - CLAUDE.md "Project state", test counts and command list match the code

6. Extract Session Learnings & Self-Learning Memory (.agent/memory.md):
   - Identify key takeaways: workflow corrections, architectural rules established, user preferences, or reusable patterns discovered
   - Append/update these learnings in .agent/memory.md for persistent memory across sessions
     (one line each: rule — why — evidence pointer — tag; correct or delete lines the session disproved)
   - If a learning applies to a skill (e.g. Code-First rules, type contracts), update that skill via skill-creator

7. Formulate Improvement Ideas:
   - Propose 1–3 concrete engineering or workflow improvements for the next working session based on session friction or insights

8. Handover note:
   - Write a detailed context summary, learnings, open questions, and next unblocked step to .agent/last-session-handover.md
   - Set "Last Updated" to today's date; name every in-flight branch, worktree and sub chat and the intended merge order

9. Close commit — never on main:
   - rtk proxy git branch --show-current → if it says main, create a branch first (chore/<short-desc>)
   - Commit only after the owner's GO; the close commit goes on that branch and through a pull request
     (push, compare link + drafted body, merge after the second GO) — main deploys production on every push
   - State what the push will carry (step 2) before asking GO; a branch must be up to date with main
     before its pull request is opened
```

---

## Handover & Self-Learning Report (emit as table)

| Item | State / Result |
|---|---|
| **Trigger** | goodbye / pause / wrap up |
| **Handover freshness** | note dated [date], last commit [date] → fresh / [N] days stale |
| **DoD pipeline** | pass / skipped / findings — per step: lint, unit, e2e, build, visual, audit:gdpr |
| **Git state** | clean / dirty — [detail]; branch [name], [n] commits ahead of `origin/main` |
| **Branches, worktrees, pull requests** | merged-but-undeleted: [list or none] · leftover worktrees: [list or none] · open pull requests: [list or none] |
| **Side-session harvest** | [n] notes in `.agent/harvest/` · consolidated yes / no · chats removed / kept: [names] |
| **BACKLOG.md** | [n] closed · [n] added · "In flight" table dated [date] · `release:status`: clean / [each ⚠ explained] — never "skipped" |
| **README.md & AGENTS.md** | fresh / updated / open questions resolved |
| **Session Learnings Logged** | `.agent/memory.md` updated with [summary of key learnings] |
| **Improvement Ideas** | 1–3 self-improvement proposals for future sessions |
| **Handover note** | `.agent/last-session-handover.md` rewritten, "Last Updated" = [date] |
| **Last commit** | [hash + message or "none this session"] |
| **Close commit** | on branch [name] via pull request / not committed — awaiting GO (never on `main`) |
| **Next unblocked step** | [one clear action] |

---

## Rules

- **Do not end silently** — if the user starts saying goodbye or says "we pause" without invoking this skill, ask once whether to run the close routine.
- **A pause counts** — the ritual runs at every pause, not only at the end of the work. A short pause may report DoD steps as "skipped — <reason>", but steps 0, 2, 4, 6 and 8 always run.
- **No commit without GO** — if uncommitted changes exist, ask the user whether to commit before closing. Never commit silently.
- **Never commit on `main`** — `main` deploys production. The close commit goes on a branch and through a pull request.
- **The backlog is part of every goodbye** — step 4 runs at every close and pause and is checked by code (`npm run release:status`, and the session-start report prints the same warning). On 2026-11-20 the "In flight" table still named three branches that had been merged and deleted two days earlier, and two owner decisions were listed as open although their work had shipped.
- **Harvest before delete** — no sub chat is archived or deleted before its `.agent/harvest/<name>.md` exists and has been consolidated.
- **Git facts through `rtk proxy`** — anything that decides a delete, a merge or a push is read with `rtk proxy git …`, never from rtk-reformatted output.
- **Memory Persistence** — always update `.agent/memory.md` with session learnings and write `.agent/last-session-handover.md` so Vera's next session boot inherits the latest intelligence (`.agent/hooks.json` injects the note in the Antigravity IDE only; in Claude Code the boot sequence reads it by hand).
