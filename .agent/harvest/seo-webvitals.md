# Harvest: Webpage build and local setup — web-vitals branch (PageSpeed + image tiers)
Session: seo-webvitals (sub-thread of the main build session) · period: 2026-11-09–2026-11-16 · commits: `2f97d84` (on main via `feature/site-build`)

## 1. What this session delivered
- PageSpeed Insights mobile run of the live home page read and recorded (16 Nov 2026 10:15 MEZ, Lighthouse 13.6.0, Moto G Power, slow 4G): Performance 90 · Accessibility 100 · Best Practices 100 · SEO 100; FCP 0.9 s · LCP 3.6 s · TBT 30 ms · CLS 0 · SI 2.2 s. No field (CrUX) data yet — domain live since the same day. Source: https://pagespeed.web.dev/analysis/https-fiorevera-hu/mhbi5rn5qc?hl=de&form_factor=mobile
- Image fix `2f97d84` — `scripts/optimize-images.js`, `src/components/Layout/Header.tsx`, `src/data/generated/imageMeta.ts`, 350 files under `public/assets/`:
  - new 240 px brand tier (`-w240.webp`, alpha kept, q80/alpha70): header logo 16.6 → 6.6 KB; header `<img>` uses `srcSmall` + srcset `240w, 810w` with `sizes="80px"`.
  - per-tier webp quality ceilings `TIER_QUALITY = { full: 82, medium: 76, small: 70 }`: hero `-w800` 80.2 → 57.4 KB, hero `-w1280` 168 → 132 KB; whole `-w800` tier 10.1 → 7.3 MB, `-w1280` tier 19.6 → 15.8 MB. Full tier untouched (restored from git after the `--force` run so the diff stays the two small tiers).
  - Gates at commit: lint 0/0, 77 unit, build 21 pages + 404, 109 visual (pixel baselines still pass at q70 → no re-baseline), production build checked at 375 and 1280 (logo picks `-w240`, hero picks `-w800` on a DPR-2 phone, full 1920 on a DPR-2 desktop).
- Local dev-server smoke after the fix: home / `/munkaim/` (15 carousels, 34 imgs, 0 broken) / `/kapcsolat/` render, no console or server errors; contact form reports `data-endpoint="configured"` because a `.env.local` exists on this Mac.

## 2. Learnings (rules a future agent must follow)
- **Lighthouse's image-savings number is an estimate at ~q60; the real gain at an acceptable quality is about half.** PageSpeed claimed 108 KiB; the fix delivers ≈60 KiB on the home page (hero 23 KB + card 22 KB + logo 10 KB). Evidence: probe sizes at q82/76/70/64 (hero 80.2/63.8/57.4/53.8 KB), commit `2f97d84`. [seo] [tooling]
- **The hero LCP is render-bound, not download-bound.** PageSpeed LCP breakdown: TTFB 0 ms, resource load delay 150 ms, resource load 410 ms, element render delay 800 ms. Smaller images barely move LCP; the four font preloads (`index.html:20-23`, ~200 KB) and the JS bundle delay the paint. [seo] [architecture]
- **Image re-encodes do not trip the pixel baselines** at the suite's tolerance (maxDiffPixelRatio 0.001 / 150 px); the 109 visual checks stayed green through q82 → q70. Don't pre-emptively re-baseline for compression changes. [testing]
- **`node scripts/optimize-images.js --force` re-encodes every tier, including the full tier**; when only a lower tier's quality changes, restore the full-tier files with `git checkout` afterwards (filter: paths not matching `-w(800|1280|240)\.webp$`) to keep the binary diff honest. [tooling]
- **The rtk hook reformats `git diff`/`git status` output** — any script that parses git output must use `rtk proxy git …` (the first file-list attempt produced `---`/`Changes` tokens, 2026-11-16). [tooling]
- **`sharp` is only resolvable from inside the repo**; scratchpad probe scripts must import it by absolute path (`<repo>/node_modules/sharp/lib/index.js`). [tooling]
- **Lighthouse's Moto G (DPR 1.75) picks the 800 w tier at 100vw**, so the 1280 tier never shows in lab LCP numbers; it matters for real DPR-3 phones only. Confirmed 2026-11-09 (QA session) and again today. [seo]
- **Desktop at DPR 2 picks the 1920 full tier for a `sizes="100vw"` hero** (observed `currentSrc` = full at 1280 px viewport); the 1280 tier only serves 1280-px-wide DPR-1 screens and DPR-2 phones. [architecture]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
| --- | --- | --- | --- |
| Tier quality ceilings full 82 / medium 76 / small 70; brand tier 240 px | agent, GO by owner 2026-11-16 | `scripts/optimize-images.js` header comment + `TIER_QUALITY` | no |
| Header logo served from `srcSmall` (240 px) with srcset | same | `src/components/Layout/Header.tsx` | no |
| Live mobile PageSpeed numbers 2026-11-16 (90/100/100/100, LCP 3.6 s) | measured | nowhere except this file | YES → `docs/qa/` (a `web-vitals-log.md` with date, tool, numbers, commit under test) |
| LCP breakdown shows 800 ms element render delay | measured | nowhere | YES → same log |
| Remaining PageSpeed diagnostics: 56 KiB unused JS, 2 long tasks, 100 ms render-blocking | measured | nowhere | YES → same log + BACKLOG |
| Vercel Hobby chosen, risk accepted | owner 2026-11-12 | `BACKLOG.md` [LAUNCH] D1 | no |

## 4. Improvements NOT implemented yet
- [ ] Font subsetting + preload only the heading face — biggest remaining LCP lever (800 ms render delay) — `index.html`, `src/styles/fonts.css`, `public/fonts/*` (Inter latin-ext 83 KB, latin 47 KB; Cormorant 33+37 KB) — acceptance: PageSpeed mobile LCP < 2.5 s, no FOIT, HU/DE/EN glyphs render (ő ű ß ä ö ü) — M — owner decision: none (already BACKLOG [PERF] 2026-11-09)
- [ ] Web-vitals log in `docs/qa/` — keeps measurements comparable across commits — new `docs/qa/web-vitals-log.md` — acceptance: one row per run with date, URL, tool/version, device, scores, metrics, commit — S — n
- [ ] Re-run PageSpeed after `2f97d84` deploys to production — proves the image fix — acceptance: image-delivery audit lists only the hero compression hint or nothing; logo row gone — S — n
- [ ] Set `fetchpriority="high"` + `<link rel="preload" imagesrcset imagesizes>` for the hero in the prerendered HTML — cuts the 150 ms resource-load delay — `scripts/prerender.ts` or `SeoHead` — acceptance: breakdown "resource load delay" ≈ 0 — S — n
- [ ] Inline critical CSS for above-the-fold (hero + header) — attacks the 100 ms render-blocking request — `scripts/prerender.ts` — acceptance: no render-blocking audit on home — M — n
- [ ] Reduce unused JS 56 KiB — route-level code splitting (`React.lazy` per page) or dropping `react-icons` for inline SVGs — `src/App.tsx`, footer/contact icons — acceptance: unused-JS audit < 20 KiB — M — n
- [ ] Lower-quality ceiling for the full tier too (82 → 76 would cut ~12 % of 45 MB, desktop DPR-2 hero 200 → ~160 KB) — not done to keep today's diff to the two small tiers — `scripts/optimize-images.js` — acceptance: 109 visual green, owner eyeballs the hero at 1920 — S — y (taste)
- [ ] Hero source photo: a sharper/cleaner original would compress better (q70 at 800 px = 57 KB is high for a 800×533 image, typical is 35–45 KB) — needs Vera's cover pick (MASTER-PLAN 1.3) — L — y
- [ ] Add a `--tier small|medium|full` flag to `optimize-images.js` so one tier can be re-encoded without the restore dance from § 2 — S — n
- [ ] CrUX / field data check in 28 days (Search Console → Core Web Vitals) once the domain has traffic — S — n
- [ ] `sizes` hint for the hero on desktop: `100vw` makes DPR-2 desktops download the 1920 full tier (200 KB) although the hero box is capped; verify the real rendered width at 1280/1440/1920 and tighten `sizes` — S — n

## 5. Skill updates needed
- `.agent/skills/seo-expert/SKILL.md`: add a "Web vitals" section — how to read PageSpeed (lab vs field, the LCP breakdown), the per-tier quality ceilings and the 240 px brand tier as pipeline facts, the rule that image savings ≈ half of Lighthouse's estimate, the probe method (sharp at q82/76/70/64 before changing a ceiling), the "re-run after deploy and log it" step, and the font-subsetting lever as the known next action.
- `.agent/skills/qa-specialist/SKILL.md` (if it owns Lighthouse): point to the future `docs/qa/web-vitals-log.md`; state that compression changes do not need a re-baseline but must still run the visual suite.
- `.agent/skills/design-system-expert/SKILL.md`: note that the header logo is the 240 px tier; any logo swap must re-run `npm run optimize:assets` and check the 44 px rendering.

## 6. Open owner decisions / things only Gabor or Vera can do
- Trigger the production deploy of `2f97d84` (merge/push to `main` if not already deployed) and re-run PageSpeed on https://www.fiorevera.hu; paste the new URL. Recommendation: do it before any further perf work so each step is measured separately.
- Decide whether the full tier may also drop to q76 (§ 4) — look at the hero at 1920 px on a Retina screen. Recommendation: yes, the gain is small but free.
- Vera's cover/hero photo pick (MASTER-PLAN 1.3) — affects the hero's weight more than any encoder setting.
- Check Google Search Console in ~4 weeks for field Core Web Vitals (no CrUX data yet).

## 7. Friction (what cost time and how to avoid it next time)
- Auto-mode classifier rejected two Bash calls because the rtk hook rewrote them after review → run one command per call when the hook will rewrite it, or re-issue verbatim once as instructed.
- rtk reformatted `git diff --name-only` → always `rtk proxy git …` when parsing.
- `sharp` not resolvable from the scratchpad → absolute import path.
- Full-tier churn from `--force` → the `--tier` flag in § 4.
- PageSpeed UI in German ("Bildübermittlung verbessern") — the audits needed two expand clicks (`find` + click by ref) before `get_page_text` showed the per-image rows; the first text read only had the headlines.
