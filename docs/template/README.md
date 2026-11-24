# Template readiness — what is framework, what is this site

> **An inventory, not a plan, and nothing here is built.** Fiore Vera is the first site of its kind: a static, multilingual business site that agents build under a contract and that its owners maintain by talking to an agent. Sibling sites are to follow from a template. This page prepares that work: it says which parts of this repository are reusable as they are, which belong to Fiore Vera, and where the two are still tied together in code. Extracting the template is a session of its own; it decides the open questions at the end.
>
> Written 2026-11-21. Counts were measured that day with a search for the site's names in each file; re-measure before relying on them.

## 1. Reusable as it is (no site name inside)

| Part | Where | What it gives a sibling site |
|---|---|---|
| Content state, validation, saving | `scripts/content/lib/state.ts`, `scripts/content/lib/tsData.ts` | Load the content as one value, check it against the contracts, write back one entry without touching the rest of a file |
| Photo intake for one slot | `scripts/content/lib/photos.ts`, `scripts/images/tiers.js` | Three WebP sizes under a size limit, numbering, duplicates, HEIC on macOS, no location data |
| Bulk image build with its refusal | `scripts/optimize-images.js` | Rebuild from originals; refuses to delete or reorder what the manifest holds |
| Gate runner, machine check, morning routine | `scripts/content/gates.ts`, `scripts/content/doctor.ts`, `scripts/content/morning.ts` | The checks of a content change as one result; what a machine can do; the start of the day |
| Change classifier (mechanism) | `scripts/content/lib/classify.ts` | "Pure content or needs the technical owner", as an allowlist |
| Branch and release tooling | `scripts/release/status.mjs`, `scripts/release/cleanup.mjs`, `scripts/release/selftest.sh`, `.githooks/` | Branch hygiene, guard self-test, the hooks that keep `main` clean |
| Build steps | `scripts/prerender.ts`, `scripts/generate-sitemap.ts`, `scripts/checkout.ts`, `scripts/validate-i18n.ts` | Static HTML per route, sitemap with dates, server identity for tests, locale parity |
| Visual approval | `scripts/visual-approve.mjs`, `scripts/visual-baseline-size.mjs`, `docs/qa/visual-review-process.md` | Re-record only with an approver, with a size reminder |
| Test patterns | `tests/unit/content.test.ts`, `tests/unit/contentLane.test.ts`, `tests/unit/operator.test.ts`, `tests/unit/docs.test.ts`, `tests/unit/skills.test.ts`, `tests/visual/layout.spec.ts` | Refusal tests that leave files byte for byte, rules as pure functions, documentation that cannot drift, layout invariants |
| Skills that describe a method, not this site | `.agent/skills/grill-me/`, `.agent/skills/to-prd/`, `.agent/skills/skill-creator/`, `.agent/skills/goodbye/`, `.agent/skills/goodmorning/`, `.agent/skills/tech-lead/`, `.agent/skills/accessibility-expert/` | Planning, the start and the close of a day, technical assessment, the decision log |
| Formats | `docs/decisions/README.md`, `.agent/harvest/README.md`, the status schema of `BACKLOG.md` | Decision log, session record, backlog line |

## 2. Framework with this site's name still inside (the seams)

These work for any site in principle and carry Fiore Vera's facts in the code today. They are the list of things a template must turn into configuration.

| File | Site facts inside |
|---|---|
| `scripts/release/publish-content.ts` | The Vercel project that serves the site, the GitHub compare address, Hungarian dialog texts naming the domain |
| `scripts/release/operator.ts` | The settings folder name under the user's home, the `FV_OPERATOR` / `FV_OPERATORS_FILE` / `FV_SESSION_FILE` variable names, Hungarian dialog texts |
| `scripts/visual-review-page.ts` | The brand line and colours of the review page, the domain in two sentences, the Hungarian wording |
| `scripts/content/lib/classify.ts` | Which data files and which text keys are content or legal (`DATA_FILES`, `LEGAL_KEYS`, `CONTACT_CONTENT_FIELDS`) |
| `scripts/content/lib/state.ts` | The file list and the shape of the content (albums, rental items, testimonials, contact, areas) |
| `scripts/content/lib/changelog.ts` | The Hungarian header of the change log and its place under `docs/vera-agent/` |
| `scripts/verify-live.ts` with `docs/launch/live-expectations.json` | The live domain and what must answer there |
| `.claude/hooks/guard-bash.sh`, `.claude/hooks/session-start.sh`, `.claude/hooks/stop-reminder.sh`, `.githooks/pre-push`, `.githooks/pre-commit`, `.githooks/pre-merge-commit` | The `FV_SKIP_HOOKS` switch, messages that name the hosting and the site |
| `.agent/skills/gdpr-guardian/scripts/audit-personal-data.ts`, `scripts/visual-contact-sheet.mjs`, `playwright.config.ts` | One or two mentions each |
| `.agent/skills/release-manager/`, `.agent/skills/qa-specialist/`, `.agent/skills/seo-expert/`, `.agent/skills/i18n-guardian/`, `.agent/skills/gdpr-guardian/`, `.agent/skills/design-system-expert/` | The method is general; the numbers, file names, languages, tokens and incidents are this site's |
| `AGENTS.md`, `CLAUDE.md`, `.claude/rules/` | The contract's structure and the short boot file are general; the page map, the brand tokens and the deploy facts are this site's |

## 3. This site only

| Part | Where |
|---|---|
| The content and its contracts | `src/data/`, `src/i18n/locales/`, `public/assets/`, `src/data/generated/imageMeta.ts` |
| The look | `src/styles/tokens.css`, `src/styles/global.css`, `src/components/`, `src/pages/`, `tests/visual/__screenshots__/` |
| Routes and addresses | `src/data/routes.ts`, `vercel.json`, `public/sitemap.xml` |
| The content operations and their catalogue | `scripts/content/ops.ts`, `scripts/content/cli.ts`, `.agent/skills/cms-coordinator/` (the loop is general; albums, rental items and the Hungarian dialogue are not) |
| The owner's guide and the concept | `docs/vera-agent/utmutato.md`, `docs/vera-agent/PRD.md` |
| Legal and privacy | `docs/gdpr/`, the `privacy.*` texts |
| Product decisions, launch, operations | `docs/PRD.md`, `MASTER-PLAN.md`, `docs/launch/`, `docs/operations/runbook.md` |
| Brand extras | `.agent/skills/lockscreen-qr-generator/`, `.agent/skills/desktop-background-generator/`, `.agent/skills/favicon-builder/`, `scripts/favicon/`, `scripts/lockscreen/` |
| History | `references/legacy/`, `docs/history/`, `.agent/harvest/`, `docs/qa/` session reports |

## 4. What a sibling site needs before its first owner can change content

In the order this repository learned it:

1. A contract (`AGENTS.md`) and guards on `main` before the first deploy, not after.
2. Content as data with contracts, every sentence keyed in every language, photos through one encoder.
3. Tests that derive counts from the data, and a test that keeps the documentation honest.
4. Gates as one command with one machine-readable result.
5. An allowlist that says what content is; everything else is the technical owner's.
6. One approval surface for a look (the review page) and one release script that establishes every condition itself.
7. A way to say who is at the keyboard, and a last line a person must pass.
8. A start-of-day and an end-of-day routine, and a one-page guide in the owner's language.

## 5. Open questions for the template session (not decided here)

- **Shape:** a template repository to copy, a generator, or a shared package the sites depend on? A copy drifts; a package needs versioning and a release path of its own.
- **Configuration:** one site file for the seams of §2 (domain, hosting project, repository, languages, owner-facing language, settings folder, variable prefix)?
- **Content model:** are albums, rental items and testimonials part of the template, or does each site declare its own content types, with operations generated from the contracts?
- **Languages:** the owner-facing texts are Hungarian here (dialogs, review page, guide, change log). Which of them become locale files of the framework?
- **Names:** `docs/vera-agent/` and the `FV_` prefix are this site's. What are the neutral names?
- **Skills:** stay under `.agent/skills/` with pointers in `.claude/skills/`, or move to where the agent discovers them natively?
- **Baselines and identity:** pixel baselines in each site's repository (the decision here, `docs/decisions/0003-pixel-baselines-in-the-repository.md`) and a PIN per person (`docs/decisions/0005-who-is-at-the-keyboard.md`), or the stronger forms from day one (a neutral renderer, separate accounts)?
- **What stays private:** this repository is public. Does a template repository hold anything a client would not want shown?

## 6. Rules for whoever does the extraction

- Take the seams of §2 from the code as it is on that day, not from this page: re-run the search.
- Extract with the tests. A part without a refusal test here is not ready to be shared.
- The first sibling site is the test of the template; expect to change the template while building it.
- Record every decision in `docs/decisions/` of the repository it applies to.
