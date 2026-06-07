---
name: skill-creator
description: Generates, formats, and standardizes new skills or refactors legacy documentation into the official Antigravity skill format. Use this when instructed to create a new skill, extract rules from obsolete files, or build a new skill-based backbone.
---

# Skill Creator (The Architect)

Central engine for standardizing and generating new agent skills in GaborPortfolio. Enforces the official Antigravity skill architecture and eliminates legacy, monolithic prompt structures.

## Core Directives

| Directive | Rule |
|---|---|
| **No copy-paste from legacy** | Extract the *intent*, rewrite as atomic actionable principles. Discard contradictory or outdated boilerplate. |
| **Strict Antigravity format** | Every skill MUST follow the output schema below. |
| **Progressive Disclosure** | The `description` field is the trigger. Make it precise — it determines when the agent loads this skill. |

## Output Schema

Every new skill is a folder at `.agent/skills/<name>/SKILL.md` with this exact structure:

```markdown
---
name: [lowercase-hyphenated-name]
description: [Third-person trigger description, e.g. "Generates unit tests..."]
---

# [Readable Skill Name]

[1-2 sentence summary]

## When to use this skill
- [Trigger condition]

## How to use it
[Actionable rules and step-by-step guidance]

## Best Practices / Constraints
- [Rule — only if not already stated above]
```

## Mandatory Checks Before Output
- [ ] **Cross-Pollination**: Scanned `.agent/skills/` for conflicts. Overlaps resolved with handshake cross-links.
- [ ] Placed in a dedicated folder (`SKILL.md` inside named folder)
- [ ] YAML frontmatter present
- [ ] `description` written in third person
- [ ] Scope is focused — if "do everything", ask user to split into two skills

## Token Efficiency Rules
Skills are loaded on every trigger — every unnecessary word has a runtime cost.

| Rule | Action |
|---|---|
| **Tables over prose** | 3+ action→rule pairs → use a table |
| **No obvious commands** | Only include project-specific non-trivial commands |
| **Tight scope** | Cross-link to other skills instead of duplicating their rules |
| **No double-stating** | A rule stated once is not restated as a "Best Practice" |
| **Line target** | ≤ 60 lines. Flag and propose cuts if exceeding 80 |

## Sparring Manifesto (Push Back Rules)
- **Veto on Bloat**: Automatically block any new skill that exceeds 80 lines without a documented architectural split. Technical excellence is found in brevity.
- **Redundancy Veto**: Veto any rule that duplicates an existing expert's domain. Demand a cross-skill handshake instead.
- **Structural Integrity**: Stop any proposal for monolithic prompts or "mega-skills." Enforce atomic, focus-driven architecture.

## Companion Resources
For complex automation, create companion scripts in `scripts/`, `examples/`, or `resources/` subdirectories. Reference them with a single run command — do not embed large bash blocks inline.
