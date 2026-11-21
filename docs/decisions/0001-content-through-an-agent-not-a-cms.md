# 0001 — Content is maintained through the CMS Coordinator agent, not through a hosted CMS
Decided by Gabor, 2026-11-18 (confirmed 2026-11-20) · Status: in force · Replaces: —

**Decision.** The owners change the site's content by talking to one dedicated agent, the CMS Coordinator (`cms-coordinator` skill), in a Claude Code session. Stage 1 is the Claude desktop app on Vera's Mac; cloud sessions are not used for now. One shared family Claude account, connected to Gabor's GitHub.

**Why.** The site stays a static site with no backend and no running cost (`docs/PRD.md` D-14), and the agent covers what a form-based CMS does not: photo intake, three languages, the visual approval, advice.

**Not chosen.** A git-based CMS with forms (Decap, Tina): faster for a single price, but it does not cover photos, translations or the visual approval, and it adds a service. Cloud sessions first: photo intake and showing the review page are not documented there, and the pixel baselines are macOS pictures.

**Consequences.** Content operations are scripts with tests (`scripts/content/`, `npm run content`); data files, locale files and the photo manifest are no longer edited by hand; tests derive content counts from the data. Commits carry Gabor's git identity, so Vercel Hobby deploys them. "Approved by Vera" is a name on pasted answers, not an authenticated identity.

**Reopen if.** After the pilot most changes are single prices or sentences and the loop is felt to be too heavy; or Vera needs to work from a device that is not a Mac.
