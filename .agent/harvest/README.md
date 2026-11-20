# Session harvest (started 2026-11-16)

One file per working session (`<session-name>.md`), written by that session from its own context,
so nothing learned in a sub chat is lost when the chat is deleted. The overarching session
consolidates these files into `.agent/memory.md`, the skills, `BACKLOG.md`, `AGENTS.md` and the
handover note, then this folder stays in the repo as the raw record.

## Format (keep it under ~150 lines, facts over prose, every claim with its evidence)

```markdown
# Harvest: <session title>
Session: <name> · period: <first day>–<last day> · commits: <hashes on main>

## 1. What this session delivered
- <deliverable> — `path` / commit

## 2. Learnings (rules a future agent must follow)
- **<rule in one line>** — why (what went wrong or was confirmed), evidence (`file:line`, commit, date).
  Tag each: [workflow] [architecture] [testing] [owner-preference] [tooling] [design] [legal] [seo] [ops]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
| e.g. form provider = Web3Forms, key in Vercel env | owner, 2026-11-12 | `docs/...`, `.env.example` | no / YES → where it should go |

## 4. Improvements NOT implemented yet
- [ ] <what> — why it matters — files — acceptance check — size S/M/L — needs owner decision? y/n
(include everything you proposed, deferred, or noticed in passing; do not filter)

## 5. Skill updates needed
- `.agent/skills/<name>/SKILL.md`: <what is missing or wrong versus the code>

## 6. Open owner decisions / things only Gabor or Vera can do
- <decision or manual step>, with the options and your recommendation

## 7. Friction (what cost time and how to avoid it next time)
- <tooling or process friction> → <concrete countermeasure>
```

Rules for the writing session: write only your own file in this folder, change nothing else,
commit nothing without the owner's GO, do not switch branches. A chat with its own worktree writes
the note on its close branch (`chore/session-close-<name>`); a chat that is closed without one gets
its note written by the coordinating session from its working notes — as happened for
`quality-gates` and `branch-guardrails` on 2026-11-20, two days after they were merged.
