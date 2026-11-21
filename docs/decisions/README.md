# Decision log

Technical decisions the owner has taken, one file each, so that the next session builds on them instead of arguing them again. Kept by the `tech-lead` skill (`.agent/skills/tech-lead/SKILL.md`).

Rules:

- One decision per file, `NNNN-short-title.md`, numbered in order.
- A file is never rewritten. A changed decision gets a new file whose **Replaces** line names the old one, and the old file gets one line: `Replaced by NNNN`.
- Write what was decided, by whom and when, the alternative that was not chosen, and which fact would reopen it.
- Product decisions that predate this log stay where they are: `docs/PRD.md` (D-1 to D-18) and `docs/launch/domain-and-hosting-plan.md` (D1 to D8).

Format:

```markdown
# NNNN — <title>
Decided by <who>, <date> · Status: in force | replaced by NNNN · Replaces: —

**Decision.** <one or two sentences>
**Why.** <the reason in terms of the business>
**Not chosen.** <the alternative, and why not>
**Consequences.** <what follows in the code and in the way of working>
**Reopen if.** <the fact that would change it>
```

## Index

| # | Decision | Date | Status |
|---|---|---|---|
| [0001](0001-content-through-an-agent-not-a-cms.md) | Content is maintained through the CMS Coordinator agent, not through a hosted CMS | 2026-11-18 | in force |
| [0002](0002-content-lane.md) | An agent may put pure catalogue content live on the owner's yes, through one script | 2026-11-18 | in force |
| [0003](0003-pixel-baselines-in-the-repository.md) | Pixel baselines stay in the repository; the visual check runs locally; the review page is the approval | 2026-11-18 | in force |
| [0004](0004-role-names-for-agents.md) | Agents carry role names, not human names | 2026-11-18 | in force |
| [0005](0005-who-is-at-the-keyboard.md) | Who is at the keyboard: a question at the start of the day, a PIN as the last line before anything goes live | 2026-11-21 | in force |
