---
paths:
  - "src/data/**"
  - "src/i18n/locales/**"
  - "scripts/content/**"
  - "scripts/images/**"
  - "scripts/archive-legacy.ts"
  - "assets-src/**"
  - "references/legacy/**"
  - "docs/vera-agent/**"
---

# Content management

- There is no CMS. The owners change content by talking to the `cms-coordinator` (skill `.agent/skills/cms-coordinator/SKILL.md`, agent `.claude/agents/cms-coordinator.md`; concept `docs/vera-agent/PRD.md`, owner's guide `docs/vera-agent/utmutato.md`).
- Content operations are pure functions in `scripts/content/ops.ts` over one `ContentState`. `scripts/content/lib/state.ts` loads, validates (Zod contracts, locale parity, cross references) and saves only what changed; `scripts/content/lib/tsData.ts` rewrites one entry of a data file and leaves the rest byte for byte; `scripts/content/lib/photos.ts` encodes the photos of ONE album or item with the shared encoder `scripts/images/tiers.js`.
- Never edit `src/data/*.ts`, the locale files or `src/data/generated/imageMeta.ts` by hand for a content change. Never run `npm run optimize:assets` on a machine without the complete `assets-src/`: the bulk script refuses when it would delete or reorder photos (`--rebuild` overrides).
- `scripts/content/lib/classify.ts` is the allowlist that decides `content` vs `needs-gabor`. A new data file or kind of content stays owner-only until it is added there on purpose.
- Tests derive content counts from the data; never pin "15 albums".
- The content lane: `npm run content:gates`, the review page, then `npm run release:publish-content`, which merges a `content/` branch itself after its own gate run, the owner's recorded approval and, last, the approver's PIN in a system dialog. An agent never asks for, sees or stores a PIN. The change log `docs/vera-agent/changelog.md` is written by the release script.
- Heavy folders are git-ignored (`references/legacy/images/`, `references/legacy/raw/`, `assets-src/`, about 155 MB each). Regenerate with `npm run archive:legacy -- --seed-assets`, then `npm run optimize:assets`. `references/legacy/manifest.json` and the Markdown pages are committed.
