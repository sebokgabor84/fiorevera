# Session handover

**Last Updated:** 2026-11-24 · live on https://www.fiorevera.hu · if this note is older than the last commit, trust `npm run release:status` and `BACKLOG.md`.

## Where things stand

- Pull requests 7 to 23 are merged; `main` is protected by the GitHub ruleset. Gates on 2026-11-24: lint, unit, build and visual green; e2e last full run 2026-11-21 (413 passed / 7 skipped).
- DNS is still at Webnode / Register.it; the Rackhost transfer (Track B) waits on the owner.
- Token diet on `chore/token-diet`: short `CLAUDE.md` plus path-scoped `.claude/rules/`, this note capped at 30 lines, Vercel plugin off for the project, a Haiku Explore agent, compact e2e output under Claude Code, RTK gone from the skills. Waits for GO 1.

## In flight

- `chore/token-diet` (shared checkout): see above.
- Kept chat "Domain move": nothing new, Track B is an owner item.
- Merged branches to delete on the owner's word: `claude/vera-concierge-7826b5`, `chore/autocompact-window`, `chore/session-close-2026-11-24`.

## Next

1. Owner: GO 1 for `chore/token-diet`, merge it, then `git pull --ff-only` in the shared checkout. Measure with `/context all` before and after.
2. Owner, by hand: Vera's PIN, her Mac setup (`docs/vera-agent/PRD.md` §3.7), then the pilot content release.
3. Owner on GitHub and Vercel: *Automatically delete head branches*, remove the two leftover Vercel projects, Deployment Protection off.
4. Vera: 15 cover picks, copy sign-off, phone check. Search Console day 30 on 2026-12-16.

## Not verified

The content lane's real release and PIN prompt have never run. The visual suite on Vera's Mac has not run.
