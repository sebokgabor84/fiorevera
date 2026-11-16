---
name: skill-creator
description: >-
  Creates new skills OR updates/reshapes existing ones. Use when instructed to
  create a new skill, update/extend an existing skill, refactor legacy
  documentation into Antigravity skill format, reshape a domain skill (e.g.
  Steampunk → floral), or propagate a skill change across projects.
---

# Skill Creator & Updater (The Architect)

Central engine for creating and maintaining agent skills in the fiorevera
project. Enforces the official Antigravity skill architecture, keeps skills
domain-aligned, and propagates changes across projects when needed.

> ⚡ **Code-First Skill Rule**: If a skill involves repeatable, multi-step execution (e.g. image optimization, i18n key audits, layout tests), ALWAYS bundle a deterministic TypeScript/Node script inside `scripts/` or `skills/<name>/scripts/`. Code executes predictably, eliminates hallucinations, and saves 90%+ tokens.

---

## Mode A — Create New Skill

### Output Schema

Every new skill is a folder at `.agent/skills/<name>/SKILL.md`:

```markdown
---
name: [lowercase-hyphenated-name]
description: [Third-person trigger description — what it does and when to use it]
---

# [Readable Skill Name]

[1-2 sentence summary]

## When to use this skill
- [Trigger condition]

## How to use it
[Actionable rules and step-by-step guidance]
```

### Mandatory Checks Before Creating

- [ ] Scanned `.agent/skills/` for conflicts — overlaps resolved with handshake cross-links
- [ ] Placed in a dedicated folder (`SKILL.md` inside named folder)
- [ ] YAML frontmatter present with `name` + `description`
- [ ] `description` written in third person
- [ ] Scope is focused — if "do everything", split into two skills
- [ ] **Registry drift gate passed** — a new or renamed skill touches three places in one change: the directory with `SKILL.md`, the `SKILL_NAMES` union in `src/types/skills.ts`, and a backticked mention in the `AGENTS.md` routing table; `tests/unit/skills.test.ts` is red otherwise (an orphan directory fails it too). Then update the skill count in `CLAUDE.md`
- [ ] Owner GO on the new skill — a missing route is proposed, not silently filled

**Proposed, not created:** `launch-ops` (hosting, DNS, domain, Vercel, cutover, uptime). `AGENTS.md` has no routing trigger for these words, so the missing-skill fallback fires today. Until the owner decides, the facts live in `docs/launch/domain-and-hosting-plan.md`, `docs/operations/runbook.md`, `seo-expert` §3a and `qa-specialist` §3; a code-first `scripts/verify-live.ts` (dig, certificates, legacy-URL sweep, 404 and redirect checks) is the suggested companion script.

---

## Mode B — Update Existing Skill

Use this mode when asked to: extend a skill, fix domain drift (e.g. GaborPortfolio
→ fiorevera), add new rules, or reshape a skill's aesthetic/domain focus.

### Update Workflow

```
1. Read the existing SKILL.md in full
2. Identify what changes are needed (additions / removals / domain rewrite)
3. State a plan: "I will add X, remove Y, rewrite Z section" → wait for approval
4. Apply targeted edits, not full rewrites (the Edit tool in Claude Code, multi_replace_file_content in Antigravity)
5. Verify: re-read the updated file, confirm no rules were accidentally lost
6. Report the diff summary to the user
```

### Update Rules

| Rule | Action |
|---|---|
| **Targeted edits only** | Change specific sections — never overwrite the whole file unless fully reshaping |
| **Preserve intent** | When domain-shifting (e.g. Steampunk → floral), rewrite the *content* but keep the *structure* |
| **No silent deletions** | If a rule is removed, note why in the review brief |
| **Update handshakes** | If a skill's triggers change, check if other skills' "Implicit Loading" sections need updating |
| **Update Vera's registry** | After reshaping, update the Skill Registry in `AGENTS.md` and mark `Domain-Aligned` = ✅ |
| **The code wins** | Verify every statement against the files it names (`package.json` scripts, `tests/`, `src/`, `scripts/`, configs) before writing it; if a skill contradicts the code, fix the skill in the same change |
| **Numbers are measured** | Test, key and file counts come from the command that produces them (`npm test -- --run`, `./node_modules/.bin/playwright test --list`, `ls`), never from memory or a session note; where a number drifts often, point to the file that holds it instead |
| **Rule, reason, file** | A learning enters a skill as the rule, the reason in one clause, and the file it points to — never as a pasted session note. Detail goes to `resources/` |
| **Decisions vs proposals** | Owner decisions carry who and when; proposals and open owner decisions are labelled as such and never phrased as rules |
| **Harvest first** | Session learnings arrive as notes in `.agent/harvest/` (sections 2, 3, 5, 7); apply every section-5 item or report why not |

### Domain Reshape Checklist (for GaborPortfolio → fiorevera)

When reshaping a skill from the GaborPortfolio base to the decoration domain:

- [ ] Replace all GaborPortfolio-specific references with fiorevera equivalents
- [ ] Replace Steampunk aesthetic tokens with floral/elegant equivalents
- [ ] Re-target domain keywords (projects/KPIs → gallery/services/floristry)
- [ ] Update the `description` trigger to match fiorevera context
- [ ] Mark the skill as reshaped in `AGENTS.md` skill registry

---

## Mode C — Cross-Project Sync

Use when a generic skill (e.g. `accessibility-expert`, `qa-specialist`) is
improved in one project and the same improvement should land in another.

```
1. Read the source skill (the improved version)
2. Read the target skill (the one to receive the update)
3. Identify delta: what was added/changed in source that target lacks
4. State the delta as a diff plan → wait for approval
5. Apply only the delta to the target — do not overwrite project-specific content
```

**Projects with shared skills:**
- `/Users/gabor.seboek/Documents/Projects/Private/fiorevera/.agent/skills/`
- `/Users/gabor.seboek/Documents/Projects/Private/Learning/GaborPortfolio/.agent/skills/`

---

## Token Efficiency Rules

| Rule | Action |
|---|---|
| **Tables over prose** | 3+ action→rule pairs → use a table |
| **No obvious commands** | Only project-specific non-trivial commands |
| **Tight scope** | Cross-link to other skills instead of duplicating rules |
| **No double-stating** | A rule stated once is not restated as a "Best Practice" |
| **Line target** | ≤ 80 lines per skill. Flag and propose cuts if exceeding 100. Documented exceptions on 2026-11-16 (count with `wc -l .agent/skills/*/SKILL.md`): `qa-specialist`, `seo-expert`, `i18n-guardian`, `gdpr-guardian`, `design-system-expert`, `accessibility-expert` and this file are over 100 because they hold the gate numbers and the owner-decision registers. First cut when one grows again: move tables into `resources/` (done for `qa-specialist/resources/debugging-guide.md`, `seo-expert/resources/web-vitals.md`) |

---

## Sparring Manifesto (Push Back Rules)
- **Veto on Bloat**: Block any skill exceeding 100 lines without a documented split reason.
- **Redundancy Veto**: Veto any rule that duplicates an existing skill's domain.
- **Structural Integrity**: Stop any monolithic prompt or "mega-skill" proposal.
- **Drift Veto**: Block any update that makes a skill's `description` trigger imprecise.

## Companion Resources
For complex automation, create companion scripts in `scripts/`, `examples/`, or
`resources/` subdirectories. Reference them with a single run command — do not
embed large bash blocks inline.

