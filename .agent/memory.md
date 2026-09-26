# 🧠 Fiore Vera — Project Memory & Self-Learning Log

> Single source of truth for persistent architectural learnings, workflow rules, user preferences, and self-improvement directives discovered across working sessions.

---

## 💡 Key Session Learnings & Directives

### 1. Code-First Skill Architecture (Zero Token Waste)
- **Learning**: Performing multi-step text calculations or unscripted repetitive tasks in prompt memory wastes tokens and introduces risk of hallucination.
- **Directive**: Any repeatable skill or task MUST bundle a deterministic TypeScript/Node script inside `scripts/` or `skills/<name>/scripts/`.

### 2. Strict Skill Registry Type Safety & Drift Gates
- **Learning**: Keeping skill lists in markdown files without type contracts allows documentation drift over time.
- **Directive**: All skills MUST be strictly typed in `src/types/skills.ts` and validated via automated Vitest test gates (`tests/unit/skills.test.ts`).

### 3. Canonical Single Agent File (`AGENTS.md`)
- **Learning**: Having both `AGENT.md` and `AGENTS.md` creates dead cross-references and user confusion.
- **Directive**: `AGENTS.md` is the single canonical agent persona, operating contract, and routing table. `AGENT.md` is deleted, and a Vitest lint gate prevents resurrection.

### 4. Mechanical Session Boot Auto-Injection
- **Learning**: Relying on habit to read `AGENTS.md` at session start is vulnerable to memory loss.
- **Directive**: `.agent/hooks.json` mechanically auto-injects `.agent/last-session-handover.md` and boot context on every session start.

### 5. Brand Identity & Design System Lock-In
- **Learning**: Design decisions must be locked in `design-system-expert` before generating visual assets.
- **Directive**: Brand palette (`#faf7f2` Warm Linen, `#7a8b7b` Soft Sage, `#e8c5c8` Muted Blush, `#d4af37` Warm Gold) and typography (`Cormorant Garamond` serif headings, `Inter` body) are now locked as the standard for all UI components and generated assets.

---

## 🚀 Improvement Proposals for Subsequent Sessions

1. **Automated Asset Optimizer Script (`scripts/optimize-assets.ts`)**:
   Create a CLI script that takes uploaded images, auto-converts to `.webp`, resizes to retina bounds, enforces `≤ 200 KB` file size limits, and outputs into `public/assets/`.

2. **Automated i18n Key Validator (`scripts/validate-i18n.ts`)**:
   Build a TypeScript script that compares `HU`, `DE`, and `EN` locale JSON files to ensure 100% key parity and flag missing translations during `npm test`.

3. **PRD Fast-Track Template**:
   Provide a structured interview script for `/grill-me` to resolve the remaining open questions (photography inventory, exact page list) in a single high-efficiency turn.
