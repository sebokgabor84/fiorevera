# 0003 — Pixel baselines stay in the repository; the visual check runs locally; the review page is the approval
Decided by Gabor, 2026-11-18 (size reminder: 2026-11-20) · Status: in force · Replaces: —

**Decision.** The 27 baseline pictures stay committed under `tests/visual/__screenshots__/`. The visual check runs where the session runs; there is no CI in the deploy path. A visual change is approved only on the generated review page (`npm run visual:page`, `docs/qa/visual-review-process.md`), also for content changes, in Hungarian for Vera.

**Why.** One way of approving a look, in every session and on every machine; nothing to set up or pay for.

**Not chosen.** A second baseline set for Linux, or CI as the reference renderer: more to keep honest, and not needed while the work happens on Macs.

**Consequences.** Every approved content change adds new pictures to the git history. `npm run test:visual:update` prints the size of the set and of its history after every re-record, `npm run visual:size` shows it at any time, and a unit test fails when the set leaves its budget (15 MB set, 100 MB history; both are constants in `scripts/visual-baseline-size.mjs`). The clean-up mechanism itself is a `BACKLOG.md` item. Whether two Macs render identical pixels is not measured yet: first step of the pilot.

**Reopen if.** The size report says "getting full"; or the visual suite is not green on Vera's Mac on an untouched `main`; or work moves to a non-Mac machine.
