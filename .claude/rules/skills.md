---
paths:
  - ".agent/**"
  - ".claude/skills/**"
  - ".claude/agents/**"
  - ".claude/rules/**"
  - "src/types/skills.ts"
  - "AGENTS.md"
  - "CLAUDE.md"
  - "README.md"
  - "BACKLOG.md"
---

# Skills, agent docs and the boot budget

- Skill registry gate: `src/types/skills.ts` holds the `SKILL_NAMES` union (17 skills). `tests/unit/skills.test.ts` fails when a directory under `.agent/skills/` has no union entry, a union entry has no `SKILL.md`, or a skill name is not mentioned in backticks in `AGENTS.md`. Adding or renaming a skill touches all three.
- The same test fails when `CLAUDE.md`, `README.md` or `AGENTS.md` contain the legacy singular agent-file name; `AGENTS.md` is canonical. Never write that name in these files.
- `tests/unit/docs.test.ts` fails when a living doc (these files, every skill, agent and rule) names an `npm run` script that does not exist, or a repository path that does not exist.
- Boot budget (`tests/unit/bootBudget.test.ts`): `CLAUDE.md` stays at most 2,000 characters; `.agent/last-session-handover.md` at most 30 lines and 3,000 characters (the session-start hook prints its first 30 lines); every file in `.claude/rules/` carries a `paths:` list, because a rule without one loads at launch. New detail goes into a path-scoped rule or a skill, never into `CLAUDE.md`.
- `.claude/skills/<name>/SKILL.md` are pointer skills that make a registry skill a slash command; each must name `.agent/skills/<name>/SKILL.md`. `.claude/agents/explore.md` overrides the built-in Explore agent with a Haiku model.
- All 17 skills describe this repo (reshape finished 2026-11-21). If a skill contradicts the code, the code wins: fix the skill in the same change.
- `.agent/` layout: `hooks.json` (handover injection for the Antigravity IDE only), `last-session-handover.md`, `memory.md` (learnings and improvement proposals), `harvest/`, `skills/`.
