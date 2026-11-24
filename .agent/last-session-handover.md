# Session handover

**Last Updated:** 2026-11-24 · live on https://www.fiorevera.hu · if this note is older than the last commit, trust `npm run release:status` and `BACKLOG.md`.

## Where things stand

- Pull requests 7 to 24 are merged; `main` is protected by the GitHub ruleset.
- Pull request 25 (`chore/token-diet`) is open: short `CLAUDE.md`, eight path-scoped `.claude/rules/`, this note capped at 30 lines, Vercel plugin off for the project, a Haiku Explore agent, dot e2e reporter under Claude Code, skills without RTK, and this close. All gates green on it: lint, unit 265, e2e 413 passed / 7 skipped, build, visual 110.
- RTK hook removed from Gábor's own Claude settings (binary still installed).
- DNS is still at Webnode / Register.it; the Rackhost transfer (Track B) waits on the owner.

## In flight

- `chore/token-diet` in the shared checkout: pull request 25, waits for the owner's merge.
- Kept chat "Domain move": nothing new, Track B is an owner item.
- Merged, to delete on the owner's word (`npm run release:cleanup`): `claude/vera-concierge-7826b5`, `chore/autocompact-window`, `chore/session-close-2026-11-24` and their worktrees.

## Next

1. Owner: merge pull request 25, then in the shared checkout `git switch main && git pull --ff-only`. In a fresh session, `/context all` to see the new boot size.
2. Personal settings, each person: Sonnet as default model, the Concise output style, unused connectors off (`BACKLOG.md` `[HARNESS]`).
3. Owner, by hand: Vera's PIN and Mac setup (`docs/vera-agent/PRD.md` §3.7), then the pilot content release.
4. Vera: 15 cover picks, copy sign-off, phone check. Search Console day 30 on 2026-12-16.

## Not verified

The new boot size was measured in characters, not with `/context all`. The content lane's real release and PIN prompt have never run.
