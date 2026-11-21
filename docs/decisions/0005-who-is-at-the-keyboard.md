# 0005 — Who is at the keyboard: a question at the start of the day, a PIN as the last line
Decided by Gabor, 2026-11-21 · Status: in force · Replaces: —

**Decision.** The Claude account and the GitHub user are shared, so neither says who is working. Two moments settle it:

1. **Start of the day.** The agent asks who is at the keyboard and runs the good-morning routine with the answer (`goodmorning` skill, `npm run content:morning -- --as <id>`). An admin (Gabor) proves it with his PIN right away, on any machine, because admin mode unlocks framework work. A content person (Vera) is taken at her word.
2. **The last line of defence.** Nothing goes live through the content lane without the approver's PIN. `npm run release:publish-content` runs every gate itself (it no longer trusts a saved result), checks the answers from the review page, and only then opens a system dialog that names what goes live and asks for the PIN.

Each person chooses their own PIN (four digits or more, like a phone PIN) in that dialog; it never passes through the chat or an agent. Three wrong entries lock that person for five minutes. The people of a machine live outside the repository (`~/.config/fiorevera/operators.json`); `FV_OPERATOR` or the file's `default` says who normally sits there.

**Why.** "Approved by Vera" must mean Vera, and Gabor must be able to do admin work on her Mac as himself.

**Not chosen.** An environment variable alone (a label anyone, including the agent, can set). A long password (the owner wants a phone-style PIN). Separate GitHub accounts first (stronger, but it waits for a test of Vercel Hobby deploys with a second account).

**Consequences and limits.** The PIN tells the two owners apart and stops a mistaken or misattributed approval. It is checked by a script on the same machine as the agent, with the hash and the lock in a file, so it is not a wall against an agent that deliberately guesses a four-digit PIN or avoids the release scripts. The walls are the GitHub ruleset on `main` (active since 2026-11-21: pull request required, no force push, no deletion) and, as the next stage, separate GitHub accounts with a code-owners rule so that GitHub itself requires Gabor's approval for everything that is not content.

**Reopen if.** The Vercel deploy test with a second GitHub account passes (then add the GitHub-side wall); or a PIN is ever found to have been bypassed.
