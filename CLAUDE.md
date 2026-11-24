# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Fiore Vera: HU/DE/EN wedding decoration site (React 19, TypeScript, Vite), prerendered per route, live on www.fiorevera.hu. `main` is production: Vercel deploys every push.

## Start of a session

- The session-start hook prints the release state, who is at the keyboard and the handover note. That is the boot: read nothing else first.
- Nobody at the keyboard yet today: skill `goodmorning` first. Pause or end: skill `goodbye`.
- Before planning a change, read `AGENTS.md` (principles, release protocol, skill routing). Open work: `BACKLOG.md`. Frozen scope: `MASTER-PLAN.md`.

## Rules everywhere

- Never edit, commit or push on `main`. Work on `feature|fix|chore|docs|content/<desc>`, rebase onto `origin/main`, never merge `main` in. Commit and push only after the owner's "GO"; the owner merges.
- Push back on a flawed plan. Every plan carries an Honest Critique.
- Done = `npm run lint`, `npm test -- --run`, `npm run test:e2e`, `npm run build`, `npm run test:visual`, in that order. Fix the code, not the test. Re-baseline visuals only after the owner approved the look.
- Content changes only through `npm run content` (skill `cms-coordinator`).
- Shared by default: an improvement goes into the repo, not into personal settings.

## Details load on demand

`.claude/rules/*.md` load when you read a matching file: `src.md` (code, tests, i18n, hydration), `content.md`, `release.md`, `deploy.md`, `gdpr.md`, `assets.md`, `skills.md`, `commands.md` (every npm script, loads with `package.json`). Skills: `.agent/skills/<name>/SKILL.md`.
