# CI proposal — GitHub Actions on every pull request

Status: **prepared, not active** (2026-11-16). The workflow is `docs/ci/github-actions-ci.yml`; in this folder GitHub ignores it. Switching it on is the owner's decision.

## Why

Today every gate runs on the machine of whoever pushes (git hooks in `.githooks/`). A push from another machine, a bypassed hook (`FV_SKIP_HOOKS=1`) or a merge done in the GitHub web interface reaches `main` unchecked, and `main` deploys production. CI repeats the gates on a neutral machine for every pull request and shows a green or red mark next to the Merge button.

## What the workflow runs

| Step | Command | Local equivalent |
|---|---|---|
| Lint + type-check of `scripts/` and `tests/` | `npm run lint` | DoD step 1 |
| Unit tests (GDPR audit, sitemap, gate self-tests included) | `npm test -- --run` | DoD step 2 |
| Production build + prerender | `npm run build` | DoD step 4 |
| E2E in chromium, **axe on every route × locale included** | `npx playwright test --project=chromium` | part of DoD step 3 (locally: four browsers) |
| Layout invariants against the production build | `npx playwright test -c playwright.visual.config.ts tests/visual/layout.spec.ts` | part of DoD step 5 (no pixels) |

On a red run the screenshots and traces are kept for 7 days as a downloadable artifact.

Cost: GitHub-hosted runners are free for public repositories, and this repository is public. Expected duration: 5–8 minutes per pull request (an estimate; it has never run).

## What it does not run, and why

- **Firefox, WebKit, Mobile Chrome.** They stay local (`npm run test:e2e`). Adding them roughly triples the run time; they can be added later as a second job.
- **The pixel comparison (`tests/visual/snapshots.spec.ts`).** The 27 committed baselines were rendered by Chromium on macOS. Linux draws text slightly differently, so every snapshot would be red on a Linux runner. See the next section.

## What the pixel gate would need on CI

Plainly: a **second, Linux-rendered baseline set**, and a second approval for every visual change.

1. Record the 27 baselines inside the environment CI uses (the official Playwright container, pinned to the Playwright version in `package-lock.json`, 1.63.0 today). A baseline from any other Linux machine is not good enough: fonts and graphics libraries differ.
2. Store them next to the macOS set. `playwright.visual.config.ts` would get a per-platform folder (`__screenshots__-linux/`); about 9 MB more in the repository.
3. A manually started workflow that re-records the Linux set and offers the PNGs as an artifact, so the owner can review them on the contact sheet (`npm run visual:sheet`) before they are committed. `scripts/visual-approve.mjs` would need a way to log an approval for the Linux set.
4. From then on **every intended visual change is approved twice**: the macOS set locally, the Linux set from the CI artifact. Forgetting one of them turns the pull request red.
5. A Playwright upgrade changes rendering and means re-recording and re-approving both sets.

Alternative: make the container the only truth and run the visual suite in Docker locally too. One baseline set, but it needs Docker on the owner's Mac and makes the pre-commit hook slower.

Recommendation: start CI **without** pixels. The local hooks keep the pixel gate; CI adds what the hooks cannot guarantee (a neutral machine, no bypass). Revisit when a second person or machine starts pushing.

## Never verified

Nothing here has run on Linux. Known unknowns:

- The layout invariants on Linux. The fonts are self-hosted, so the layout should match; if a test is red only on CI, look at the invariant's numbers before touching CSS.
- `tests/e2e/vitals.spec.ts` asserts LCP and CLS on the dev build; a slow runner may need the two retries CI already allows.
- The Firefox `CFFIXED_USER_HOME` workaround in `playwright.config.ts` is inert outside macOS and Firefox is not part of this workflow.
- The action versions are major tags (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`). Pinning them to commit hashes is safer against a compromised tag; that was not done here because the hashes were not looked up.

## Switching it on

```bash
mkdir -p .github/workflows && git mv docs/ci/github-actions-ci.yml .github/workflows/ci.yml
```

Commit, push the branch, open a pull request: the run appears under the pull request's "Checks". Pushing a file under `.github/workflows/` over HTTPS needs a token with the `workflow` scope; with SSH or the GitHub desktop login it just works.

To make the green mark mandatory: GitHub → repository **Settings → Branches → Add branch ruleset** for `main` → require the status check `lint · unit · build · e2e (chromium) · axe · layout`. Without that rule a red pull request can still be merged.

Switching it off again: delete `.github/workflows/ci.yml` (or disable the workflow under the repository's **Actions** tab).
