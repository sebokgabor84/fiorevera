---
name: goodbye
description: >-
  Session-close ritual and self-learning engine for the Fiore Vera project. Use
  when the user says /goodbye, "goodbye", "closing the session", "wrap up", or
  before ending any working session in this repo. Runs Vera's session-close
  checklist, extracts session learnings, syncs memory & BACKLOG.md, checks git
  state, and reports the handover so the next session can pick up cleanly.
---

# Goodbye — Fiore Vera Session Close & Self-Learning Ritual

Close the working session cleanly, extract session learnings, update project memory, and leave the repository in a deterministic, fully recoverable state.

---

## Session-Close & Self-Learning Checklist

Run these steps in order, then report the results as a table (see below).

```
1. DoD pipeline (lint + unit + e2e):
   - npm run lint        → must be 0 errors
   - npm test -- --run   → must be all green
   - npm run test:e2e    → must all pass (when e2e specs exist)

2. Git state audit:
   - git status          → report clean / dirty / staged
   - If dirty: ask user whether to stash, commit, or leave as-is

3. BACKLOG.md sync:
   - Mark completed items as [x]
   - Append emergent ideas as [ ]
   - Note in-progress items [/] in handover

4. README.md & AGENTS.md freshness:
   - Confirm "Current iteration" matches actual state
   - Resolve open questions in AGENTS.md if answered this session

5. Extract Session Learnings & Self-Learning Memory (.agent/memory.md):
   - Identify key takeaways: workflow corrections, architectural rules established, user preferences, or reusable patterns discovered
   - Append/update these learnings in .agent/memory.md for persistent memory across sessions
   - If a learning applies to a skill (e.g. Code-First rules, type contracts), update that skill via skill-creator

6. Formulate Improvement Ideas:
   - Propose 1–3 concrete engineering or workflow improvements for the next working session based on session friction or insights

7. Handover note:
   - Write a detailed context summary, learnings, open questions, and next unblocked step to .agent/last-session-handover.md
```

---

## Handover & Self-Learning Report (emit as table)

| Item | State / Result |
|---|---|
| **DoD pipeline** | pass / skipped / findings |
| **Git state** | clean / dirty — [detail] |
| **BACKLOG.md** | synced / [items updated] |
| **README.md & AGENTS.md** | fresh / updated / open questions resolved |
| **Session Learnings Logged** | `.agent/memory.md` updated with [summary of key learnings] |
| **Improvement Ideas** | 1–3 self-improvement proposals for future sessions |
| **Last commit** | [hash + message or "none this session"] |
| **Next unblocked step** | [one clear action] |

---

## Rules

- **Do not end silently** — if the user starts saying goodbye without invoking this skill, ask once whether to run the close routine.
- **No commit without GO** — if uncommitted changes exist, ask the user whether to commit before closing. Never commit silently.
- **Memory Persistence** — always update `.agent/memory.md` with session learnings and write `.agent/last-session-handover.md` so Vera's next session boot automatically inherits the latest intelligence.
