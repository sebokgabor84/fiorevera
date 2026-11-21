# 0002 — An agent may put pure catalogue content live on the owner's yes, through one script
Decided by Gabor, 2026-11-18 · Status: in force · Replaces: —

**Decision.** `npm run release:publish-content` is the one exception to "an agent never merges". It merges a `content/` branch into `main` by itself, and only when it has checked, for the exact state of the checkout: the change is class `content` (`scripts/content/lib/classify.ts`), `npm run content:gates` is green, and the owner approved on the review page (every screen OK, look approved, go-live GO) or, when no screen changed, with a recorded sentence. Everything else still needs the owner's merge on GitHub (GO 2).

**Why.** "On her own" is the point of the CMS Coordinator: content must not wait for the technical owner's evening.

**Not chosen.** Vera presses "Merge" on GitHub (she would have to read GitHub, and can get stuck there). Gabor merges everything (content waits for him).

**Consequences.** The classifier is an allowlist: a new data file or kind of content is owner-only until it is added on purpose. Legal texts, e-mail, address, the hero photo, components, styles, tests and dependencies never pass. A typed `gh pr merge` is denied by the Bash guard. The script needs `gh` signed in on the machine. Rollback is a revert through the same script. The wall behind the scripts is the GitHub ruleset on `main` (owner switch).

**Reopen if.** A content release puts something live that the gates and the review should have stopped; or the ruleset on `main` cannot be kept on.
