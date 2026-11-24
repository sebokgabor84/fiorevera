---
paths:
  - "package.json"
---

# Every npm script, annotated

Daily: `npm run lint`, `npm test -- --run`, `npm run test:e2e`, `npm run build`, `npm run test:visual`, `npm run release:status`, `npm run content -- help`, `npm run dev`.

```bash
npm install
npm run dev              # Vite dev server (http://localhost:5173) — CSR in dev; prerendered HTML only in the build
npm run dev:form         # fake form provider + Vite dev server wired to it: test the contact form locally without spending real submissions
npm run form:fake        # only the fake provider (logs JSON POSTs, answers CORS preflight; port FAKE_FORM_PORT, default 8787; add -- --status=500 to test the failure path)
npm run build            # sitemap → tsc -b → vite build → vite build --ssr → scripts/prerender.ts (dist/<route>/index.html)
npm run preview          # serve dist/
npm run lint             # eslint . (0 errors AND 0 warnings) + tsc -p tsconfig.scripts.json (type-check of scripts/, skill scripts, Playwright configs, tests/)
npm run format           # prettier --write .
npm test -- --run        # vitest (261 tests in 25 files on 2026-11-21: content operations and their refusals, the content lane's refusal rules, approver PIN and the morning routine, documentation that names only existing commands, operations and files, the owner's language standard (no rejected Hungarian word in a text people read), baseline size, routes, data, i18n parity, server render of every route, archive, assets, form logic, GDPR audit + register seal, sitemap + lastmod, font coverage of every rendered character, favicon set, rental sizes, visual review page, self-tests of the gates)
npm run test:e2e         # playwright, 4 browsers, incl. axe on every route × locale (tests/e2e/a11y.spec.ts); reuses a running dev server only if it was started in THIS checkout (413 passed / 7 skipped on 2026-11-19: compare the total, a piped `| tail` hides the exit code)
npm run test:vitals      # only tests/e2e/vitals.spec.ts
npm run test:visual      # visual regression + layout invariants vs the PRODUCTION build (vite preview :4173); chromium; baselines in tests/visual/__screenshots__/
npm run visual:review    # the same run with the HTML report (expected / actual / diff per snapshot) — for your own look at a red run
npm run visual:page      # the owner's review page for a red visual run (.visual-review/, publish as an Artifact); `-- --answers <file>` judges the pasted answers — the only way a visual change is approved: docs/qa/visual-review-process.md
npm run test:visual:update  # re-baseline — ONLY after the owner approved the new look (scripts/visual-approve.mjs, needs -- --approved-by="<name>")
npm run visual:sheet     # tests/visual/review.html: every baseline on one page; after a red run, expected / actual / diff per failed snapshot (generated, git-ignored)
npm run prepush          # lint → unit → build → visual (the gates .githooks/pre-push runs; the GDPR audit is part of the unit run)
npm run prepare          # git config core.hooksPath .githooks || true (runs on npm install; tolerant, so a plain `npm ci` works outside a git checkout)
npm run release:status   # branch, ahead/behind, open pull requests, keep/delete verdict per branch and worktree, hook health, BACKLOG.md drift (-- --fetch, -- --previews, -- --json)
npm run release:cleanup  # dry run; -- --apply <branch> deletes a MERGED branch (worktree, local, origin)
npm run content -- <operation>  # the ONE way to change content: albums, photos, covers, texts in 3 languages, rental items, testimonials, contact (help: npm run content -- help); answers with one JSON object, writes nothing when it refuses
npm run content:doctor   # what this machine can do for a content change (platform, hooks, gh, HEIC, baseline size)
npm run content:gates    # lint → unit → build → layout → pictures → e2e on chromium + Mobile Chrome, result for exactly this state in .content/gates.json
npm run content:morning -- --as <id>  # the start-of-day routine (skill goodmorning): records who is at the keyboard (an admin proves it with the PIN), machine check, checkout state, change log, handover freshness, live-site check; one JSON answer with an `attention` list
npm run content:classify # is the change against main pure catalogue content (exit 0) or does it need the technical owner (exit 10)
npm run release:publish-content  # the content lane: merges a content/ branch itself after its OWN run of every gate, the review answers and, last, the approver's PIN in a system dialog (--check, --handoff, --rollback, --abandon)
npm run release:operator # who may approve on this machine (PINs chosen by the people themselves, stored hashed outside the repo); -- --set <id> --role content|admin --name "…", -- --verify --as <id>
npm run visual:size      # weight of the pixel baselines: the committed set and its git history against their budgets
npm run release:selftest # replays the forbidden moves (edit/commit/push on main, bypass flags) in a throw-away repo and prints each refusal
npm run archive:legacy -- --seed-assets   # Webnode archive → references/legacy/ + assets-src/
npm run optimize:assets  # assets-src/ → public/assets/**.webp + src/data/generated/imageMeta.ts
npm run sitemap          # regenerates public/sitemap.xml (also the first step of the build)
npm run validate:i18n    # key-parity gate on the three locale files
npm run audit:gdpr       # every data sink in src/, index.html and the CSP must be declared in docs/gdpr/data-register.json (also runs inside npm test); `-- --seal` after an intended register change
npm run verify:live      # read-only health check of https://www.fiorevera.hu: DNS, certificates, all routes, legacy URLs, redirects, 404s (expectations in docs/launch/live-expectations.json)
npm run lockscreen       # regenerates the QR lockscreen PNGs
npm run lockscreen:variants  # regenerates the three alternate lockscreen designs
npm run favicon          # public/favicon.svg → favicon-16/32, apple-touch-icon, android-chrome PNGs (add -- --from <variant-id> to ship a design-round variant first)
npm run favicon:variants # regenerates docs/design/favicon-variants.html (the favicon design round, with 16 px raster proof)
```
