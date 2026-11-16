# Harvest: Contact form — provider, local testing, validation, e2e safety
Session: contact-form (side session of "Webpage build and local setup") · period: 2026-11-09–2026-11-16 · commits: `742fa67`, `189cc00`, `f4feae3`, `a22e629` (all on main; `a22e629` via PR #4)

## 1. What this session delivered
- Unit tests for `submitInquiry` through its injectable `fetchImpl` (6 tests) — `tests/unit/submitInquiry.test.ts` / `742fa67`
- Local fake form provider (logs JSON POSTs, CORS preflight, `--status=500`, `--dev` spawns Vite) — `scripts/fake-form-provider.ts`, `npm run dev:form`, `npm run form:fake` / `742fa67`
- Prefilled `mailto:` fallback in the error state (same subject as the provider mail, labelled fields, CRLF) — `src/lib/inquiryMailto.ts`, `tests/unit/inquiryMailto.test.ts` (4), `InquiryForm.tsx:188`, `contact.form.mailFallback` ×3 locales / `189cc00`
- Field-level validation as a pure function returning error codes — `src/lib/validateInquiry.ts`, `tests/unit/validateInquiry.test.ts` (9), `contact.form.errors.phone|tooLong` ×3 locales / `f4feae3`
- Real Web3Forms delivery set up with the owner and confirmed locally (2026-11-11, HTTP 200, mail with all fields in the inbox) — BACKLOG `[FORM]` line 21
- Sender name `from_name: "Fiore Vera weboldal"` — `src/lib/submitInquiry.ts:25,41` / `a22e629`
- Bug fix: page jumped to the footer after a successful submit → success card scrolls into view and takes focus — `InquiryForm.tsx:36` / `a22e629`
- Fail-closed e2e guard: auto fixture aborts every request to the real providers in every test of every spec — `tests/e2e/fixtures.ts`, all 7 specs import from it / `a22e629`
- Data register names Web3Forms as processor — `docs/gdpr/data-register.json:20` / `a22e629`
- Running record of the whole session — side-session note `contact-form-local-testing.md` (outside the repo, will be lost with the chat folder)

## 2. Learnings (rules a future agent must follow)
- **`.env.local` leaks into every running dev server, and e2e reuses that server.** Vite restarts on `.env*` changes; `playwright.config.ts:56` has `reuseExistingServer`. Creating `.env.local` with the real endpoint flipped `data-endpoint` to `configured`, un-skipped 3 success tests and posted to the real provider → 12 failures (3 tests × 4 browsers), 2026-11-09. Tests must never depend on the server's env. [testing]
- **Every e2e spec imports `test, expect` from `./fixtures`, never from `@playwright/test`.** The auto fixture (`tests/e2e/fixtures.ts:10-18`) aborts `api.web3forms.com` and `formspree.io` at context level; `page.route()` mocks override it. A spec with the bare import silently loses the guard and can spend real submissions (250/month) and reach Vera's inbox. [testing]
- **A piped `| tail` hides the exit code of a test run.** On 2026-11-16 a background e2e run reported exit 0 while all 71 Firefox tests failed to launch (210 passed instead of 280). Always `set -o pipefail` and compare the passed total with the expected one. [tooling]
- **Swapping a tall element for a short one clamps the scroll to the new page bottom.** Fix pattern: `useEffect` on the state change → `scrollIntoView({ block: 'start' })` (global `scroll-padding-top` handles the sticky header) + `focus()` with `tabIndex={-1}`; assert `toBeInViewport({ ratio: 1 })` and `toBeFocused()` (`contact.spec.ts:72`). Owner-reported 2026-11-11. [design]
- **Validation lives in a pure function that returns codes; the component maps codes to i18n.** `noValidate` only silences browser bubbles, so pass `input.validity.valid` in (`InquiryForm.tsx:53`). Insertion order of the error object is the focus order. No character filtering: React escapes output and the mailto is percent-encoded, so XSS is not a form concern. [architecture]
- **The provider's payload key names are the mail's field labels.** Web3Forms prettifies `wedding_date` → "Wedding date"; `email` becomes Reply-To; `subject` and `from_name` are honoured on the free plan. Confirmed by the delivered mail, 2026-11-11. [ops]
- **The Web3Forms access key is public by design and cannot be hashed or hidden in a static site.** `VITE_*` is inlined into the bundle. It only selects the delivery inbox. The only way to hide it is a server-side proxy. Still: never ask for it or repeat it in chat; the owner pastes it into git-ignored `.env.local`; verify by length (36-char UUID) only. [ops]
- **Do not use the inbox's own address as the sender in a real test.** I typed info.fiorevera@gmail.com as the customer e-mail; the owner then asked whether that field was the customer's address or theirs. Use a distinct address so Reply-To is visibly different. [workflow]
- **Real submissions cost quota; ask before each extra one.** Tests by hand in a browser are the only real sends. E2E runs only by hand (no CI; hooks run build + visual), visual never presses submit. The owner treats quota waste as a major bug (2026-11-11). [owner-preference]
- **Owner wants a small and a large option, then picks small.** "Minimum only" for validation, "Prefilled fallback" for mailto; asks for plain-English explanations and numbered step-by-step setup guidance. [owner-preference]
- **Rebase in a shared, dirty checkout without stash:** when the base tree equals the old parent's tree, replay with `git commit-tree <tree> -p <base>` + `git update-ref <branch> <new> <old>`, then `--force-with-lease=<branch>:<old>`. Done 2026-11-16 (`19f4b14` → `a22e629`), working tree untouched. [workflow]
- **The Browser pane does not list cross-origin `fetch` calls in `read_network_requests`.** Use `performance.getEntriesByType('resource')` and read `responseStatus`; the success state alone also proves `res.ok` (`submitInquiry.ts:50`). [tooling]
- **Shell traps:** `rtk` rewrites `npx` (call `./node_modules/.bin/<bin>`), filters `git diff`/`grep` output (use `rtk proxy`), zsh aliases `g`, unquoted globs fail. A commit with `src/` staged runs build + visual in the pre-commit hook for minutes → run it in the background. [tooling]
- **Form-level escaping cannot protect future inbox-reading agents from prompt injection.** Attackers can mail the inbox directly. The defence is least privilege: read + draft only, human approval for outward actions, sender-based origin checks. Owner asked 2026-11-10. [architecture]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| Form provider = Web3Forms, free plan (250 submissions/month, 1 recipient, 30-day history) | owner, 2026-11-11 | `docs/gdpr/data-register.json:20`, BACKLOG line 21 | Plan limits and the reasons for the choice (no backend, public key, free honeypot/spam filter; Formspree free = 50/month) are only in this file → `docs/launch/` or `.agent/memory.md` |
| Web3Forms: company in Kerala (India), servers US-East, DPA offered, logs purged after 2 months | read from web3forms.com, 2026-11-10 | `docs/gdpr/data-register.json:20` | Privacy page does not name the processor yet (BACKLOG `[GDPR]` line 50, open) |
| Endpoint `https://api.web3forms.com/submit`, env `VITE_FORM_ENDPOINT` + `VITE_FORM_ACCESS_KEY` | PRD D-9 | `.env.example`, `README.md:151`, `submitInquiry.ts:29-31` | no |
| Key stays in git-ignored `.env.local` locally and in Vercel env (Production + Preview); never in chat or git | owner + session, 2026-11-09 | BACKLOG lines 21–22, `docs/launch/domain-and-hosting-plan.md:61` | no |
| Vercel env vars set, live submission delivered | owner, 2026-11-16 (other session) | BACKLOG line 22 | no |
| Subject `Árajánlatkérés – fiorevera.hu (<name>)`, shared by provider mail and mailto | session, 2026-11-09 | `submitInquiry.ts:22` | no |
| Sender name "Fiore Vera weboldal" | session, 2026-11-11, owner GO 2026-11-16 | `submitInquiry.ts:25` | Owner never explicitly confirmed it shows in Gmail → §6 |
| Failure reasons `spam / config / network / rejected`; filled honeypot `website` returns ok without a request | first build + `742fa67` | `submitInquiry.ts:19,28` | no |
| Failed submission offers a prefilled mailto ("Prefilled fallback") | owner, 2026-11-09 | `InquiryForm.tsx:188`, `src/lib/inquiryMailto.ts` | no |
| Validation = "Minimum only": name ≤100, e-mail ≤254 + dot in domain + browser verdict, phone optional `^\+?\d(?: ?\d){5,14}$` sent as typed, venue ≤150, message ≤2000, no character filtering | owner, 2026-11-10 | `src/lib/validateInquiry.ts:31-40` | no |
| E2E can never reach a real provider; managed dev server gets `https://mock-form-endpoint.test/submit` | owner demand, 2026-11-11 | `tests/e2e/fixtures.ts`, `playwright.config.ts:58` | YES → `.agent/skills/qa-specialist/SKILL.md:98` still describes only the per-spec mock |
| CSP `connect-src` allows `api.web3forms.com` and `formspree.io` | first build | `vercel.json:49` | no |
| Local fake provider: `npm run dev:form` / `npm run form:fake`, port `FAKE_FORM_PORT` (8787) | owner "Build all three", 2026-11-09 | `package.json:8-9`, `scripts/fake-form-provider.ts` | YES → not in `README.md` or `CLAUDE.md` command lists |
| Over quota: warning mails at 90 % and 100 %, then submissions refused until next month; the form then shows error + mailto | read from web3forms.com, 2026-11-10 | nowhere | YES → `docs/launch/domain-and-hosting-plan.md` (operations) |

## 4. Improvements NOT implemented yet
- [ ] BACKLOG `[AGENTS]` line: inbox-agent policy (read + draft only, envelope prompt, human approval for outward actions) — offered 2026-11-10, never written — `BACKLOG.md` — line exists — S — n
- [ ] Vercel function proxy that keeps the access key server-side and adds rate limiting — only worth it if spam appears — `api/inquiry.ts`, `submitInquiry.ts` — key absent from the bundle, e2e green — M — y
- [ ] Turn on Web3Forms hCaptcha (free) if honeypot + server filter let spam through — `InquiryForm.tsx`, CSP, data register, privacy copy — spam stops, audit:gdpr green — M — y
- [ ] EU-hosted mail API instead of Web3Forms if EU data residency is wanted — `submitInquiry.ts` is the single swap point — M — y
- [ ] Name Web3Forms on the privacy page in HU/DE/EN — `privacy.sections.form` — BACKLOG `[GDPR]` line 50 closed — S — y (copy sign-off)
- [ ] Apply the provider guard to `tests/visual/` too (own `test` import; safe today only because no visual test presses submit; the production build under test carries the real key) — `tests/visual/*.spec.ts` — bare `@playwright/test` import gone — S — n
- [ ] Lint or unit gate that fails when a file in `tests/e2e/` imports `test` from `@playwright/test` — keeps the guard structural — `eslint.config.js` (`no-restricted-imports`) — lint red on a bare import — S — n
- [ ] Success-path e2e tests skip silently when the server has no endpoint (`contact.spec.ts`, `test.skip(!configured)`) — make it a hard failure when `CI` is set — S — n
- [ ] Hungarian field labels in the delivered mail (now "Wedding date", "Venue") — rename payload keys or use a Web3Forms template — `submitInquiry.ts:33-41`, unit test key set — S — y
- [ ] Larger validation variant (invalid-character rules and more) — declined by the owner, "Minimum only" — do not build unless asked — M — y
- [ ] Document `dev:form` / `form:fake` and the fixture rule in `README.md`, `CLAUDE.md` — S — n
- [ ] Quota awareness: note the 250/month limit, the warning mails and the 30-day history (Web3Forms is not an archive) in the launch/operations doc — S — n
- [ ] Sign the Web3Forms DPA; Gmail mailbox has no DPA (BACKLOG `[GDPR]` line 50) — S — y

## 5. Skill updates needed
- `.agent/skills/qa-specialist/SKILL.md`: line 25 counts are stale (now 71 tests per project, about 280 passed / 4 skipped); line 42 says `contact` (5), it is 7 per browser; line 98 must describe `tests/e2e/fixtures.ts`, the "import from `./fixtures`" rule and the `.env.local` leak; add the `pipefail` / expected-total rule.
- `.agent/skills/gdpr-guardian/SKILL.md`: state that the processor is chosen (Web3Forms, India/US-East) and that the privacy page must name it; test sends go only to the owner's inbox.
- `.agent/skills/accessibility-expert/SKILL.md`: add the pattern "state swap → move focus to the new region (`tabIndex={-1}`, `role="status"`) and scroll it into view".
- `.agent/skills/goodbye/SKILL.md`: side-session notes live outside the repo; the close ritual should copy or harvest them.

## 6. Open owner decisions / things only Gabor or Vera can do
- Confirm in Gmail that the sender shows as "Fiore Vera weboldal" and that Reply goes to the customer's address (send one inquiry with a non-Fiore-Vera address). Never explicitly confirmed. Recommendation: do it once on the live site.
- Privacy copy naming Web3Forms (HU/DE/EN): approve wording. Recommendation: yes, before promoting the site.
- DPA: accept the Web3Forms DPA in their dashboard; decide Gmail vs Workspace/HU mailbox. Recommendation: accept the DPA now, decide the mailbox later.
- Spam policy: stay with honeypot + server filter, or add hCaptcha / proxy. Recommendation: wait for real spam.
- Mail labels in Hungarian for Vera: yes/no. Recommendation: yes if Vera reads the mails herself.
- Watch the Web3Forms warning mails (90 % / 100 %) in the info.fiorevera@gmail.com inbox.

## 7. Friction (what cost time and how to avoid it next time)
- My own `.env.local` broke a sibling session's e2e run (12 failures) → announce env changes in the shared note first; fixed for good by the fixture.
- Playwright Firefox stopped launching after the macOS update, noticed only at commit time → run the full e2e suite at session start; fixed by another session in `d6846bb` (PR #5).
- `web3forms.com` pages returned 403 to WebFetch and two docs URLs were 404 → read vendor pages through the Browser pane.
- Browser pane: `read_page` empty while the pane is hidden, mobile viewport needs `resize_window` and a reset → use `find` / `form_input` / JS, reset to desktop afterwards.
- Three sessions in one checkout: could not stash, rebase or touch `tests/visual/`, `docs/qa/`, the handover note → give writing sessions their own worktree.
- Commit messages and PR bodies had to be handed over by link because there is no `gh` CLI → keep the compare-link + drafted-body routine.
