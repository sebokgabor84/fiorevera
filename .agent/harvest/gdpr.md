# Harvest: GDPR guardian + greetings-list consent concept
Session: gdpr · period: 2026-11-10 · commits: `aefc023` (on main; pushed 2026-11-10 with sibling commits `189cc00`, `f4feae3`, `da226a1`)

## 1. What this session delivered
- `gdpr-guardian` skill (routing row in `AGENTS.md`, union entry in `src/types/skills.ts`, 13-skill State Report) — `.agent/skills/gdpr-guardian/SKILL.md` / `aefc023`
- Deterministic personal-data audit, exit 1 on any undeclared sink — `.agent/skills/gdpr-guardian/scripts/audit-personal-data.ts`, `npm run audit:gdpr` (added to `package.json` on the owner's request)
- Machine-readable personal-data register (8 form fields, 2 storage keys, 2 env vars, 1 network sink, 4 processor hosts, 6 outbound hosts, 2 navigator signals) — `docs/gdpr/data-register.json` (later edited by `698b150`, `a22e629`; still `version: 2026-11-10`)
- Greetings-list consent concept, 8 sections incl. HU/DE/EN copy proposals (§7) and the 10-point go-live checklist (§6) — `docs/gdpr/newsletter-consent-concept.md` (256 lines)
- `BACKLOG.md` lines 49 (`[FEATURE]` greetings list, build-gated) and 50 (`[GDPR]` pre-launch gaps); `CLAUDE.md` personal-data-register paragraph + `audit:gdpr` command line
- Hand-over note outside the repo: `~/Library/Application Support/Claude/side-session-notes/local_fd6e2fa2-…/gdpr-guardian.md`

## 2. Learnings (rules a future agent must follow)
- **Every data sink must declare itself; fix the register, never the regexes** — the audit found 0 false positives only after comments were stripped (`code()` helper, `audit-personal-data.ts:30`); a sink mentioned in a comment is not a sink. [tooling] [legal]
- **Strip comments before pattern-matching source** — the first audit run flagged hosts and keys that lived in JSDoc only; `audit-personal-data.ts:29-30`, 2026-11-10. [tooling]
- **A privacy page that describes processing the code does not do is as wrong as the reverse** — Vercel Web Analytics was on the page and in the CSP but had no code until `698b150` (2026-11-12). SKILL.md Sparring Manifesto, line 77. [legal] [architecture]
- **"It is only a greeting" is still advertising under Hungarian Grt. § 6** — every send-out to a visitor needs prior, separate, unticked consent; concept §2.2, SKILL.md line 80. [legal]
- **Marketing consent is never `required`, never bundled with the inquiry consent** — the inquiry consent is the service itself, a greetings box is not; SKILL.md §2 "Consent text" row. [legal] [design]
- **Reusing the wedding date for an anniversary mail is a new purpose** — needs its own consent and its own privacy section (concept §3, partial opt-out "keep greetings, stop the anniversary"). [legal]
- **Legal statements carry [INFO] / [CONFIRM] / [DECISION] tags, with a "not legal advice" banner** — the owner decided 2026-11-12 (launch plan D8) that no lawyer is involved, so the tags stay as markers of what was never checked. [workflow] [legal]
- **Copy proposals live in the concept note until the owner's GO; the i18n parity gate would otherwise force all three locales at once** — `grep greetings src/i18n/locales/*.json` → 0 hits on 2026-11-16, by design. [workflow] [owner-preference]
- **Concept-only briefs stay concept-only** — the owner asked "was the implementation done in the privacy and in the contact form?"; the answer was no, on purpose, and the owner confirmed "for now we are done". Say the scope back before closing. [workflow] [owner-preference]
- **DE addresses the couple as *ihr*, no rewrite** — owner, 2026-11-10; recorded in SKILL.md line 70/83 and BACKLOG line 39. HU te/ti still open. [owner-preference] [design]
- **Pushing a shared branch ships other sessions' commits** — the first push carried two contact-form commits; a new commit (`da226a1`) landed seconds later and was pushed only after a second explicit GO. Always `git fetch` and list what is ahead before and after a push. [workflow]
- **RTK hook rewrites commands; use `./node_modules/.bin/tsx`, not `npx`** — `npx tsx` was rewritten and failed, 2026-11-10. [tooling]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
| Greetings list is a wish, not a feature; build only after [CONFIRM] + provider/transfer choice | owner, 2026-11-10 | `BACKLOG.md:49`, concept §6 | no |
| DE voice for the couple = *ihr* | owner, 2026-11-10 | `SKILL.md:70,83`, `BACKLOG.md:39` | no |
| `npm run audit:gdpr` is the gate before any Review Brief touching visitor data | owner, 2026-11-10 | `package.json`, `CLAUDE.md`, `SKILL.md:42-53` | not in `.githooks/*` or a Vitest wrapper → see §4 |
| Lawful basis: GDPR Art. 6(1)(a)/7, Grt. § 6, ePrivacy Art. 13, DE UWG § 7(2), AT TKG § 174 (DE/AT as [CONFIRM]) | session, 2026-11-10 | concept §2 | no |
| Valid consent = separate unticked box, double opt-in, consent record (text version, time, locale, IP hash), partial withdrawal, frequency ceiling, no tracking | session (DECISION rows for owner), 2026-11-10 | concept §3 | no |
| Provider recommendation: EU-hosted list tool with DPA (Brevo / MailerLite) over spreadsheet+BCC (vetoed) or a Vercel function | session, 2026-11-10 | concept §5 | owner choice open |
| Form provider = Web3Forms, key public by design, set on Vercel | owner, 2026-11-11 / 2026-11-16 | `BACKLOG.md:21-22`, `.env.example`, `submitInquiry.ts` | privacy `form` body still says "az űrlapszolgáltató", does not name Web3Forms (Art. 13(1)(e)) → YES, `privacy.sections.form.body` HU/DE/EN + `PRIVACY_UPDATED` bump |
| Vercel Web Analytics wired (D5) | owner, 2026-11-12 | `src/lib/analytics.ts`, `698b150` | no — but `SKILL.md:38` still says "not wired in code" → §5 |
| Vercel Inc. is a processor (IP logs); Hobby DPA coverage [CONFIRM]; D8 no lawyer | owner, 2026-11-12 | `docs/launch/domain-and-hosting-plan.md#7`, `BACKLOG.md:51` | `hosting` entry in `data-register.json` and `privacy.sections.hosting` → YES, both still missing (register has only the 4 CSP hosts) |
| Inquiry data sits in a personal Gmail mailbox, no DPA | session finding, 2026-11-10 | concept §1 item 2, `BACKLOG.md:50` | decision open (Workspace or HU mailbox) |
| `PRIVACY_UPDATED` = 9 Nov 2026 in all locales | — | `src/data/contact.ts:18-22` | stale once the form/hosting lines ship → bump in that change |

## 4. Improvements NOT implemented yet
- [ ] Name Web3Forms (company, country, transfer mechanism) in `privacy.sections.form` HU/DE/EN; bump `PRIVACY_UPDATED` — Art. 13(1)(e) — `src/i18n/locales/*.json`, `src/data/contact.ts` — privacy page names the processor in 3 locales, i18n test green — S — owner R-1 copy sign-off: y
- [ ] `privacy.sections.hosting` line + `hosting` register entry for Vercel (proposal already in the launch plan §7) — Art. 13 completeness, audit stays honest — `hu/de/en.json`, `PrivacyPage.tsx` section list, `data-register.json` — audit green, section rendered — S — y (R-1)
- [ ] Wrap the audit in Vitest (`tests/unit/gdpr.test.ts` spawning the script or importing its checks) so it runs in `npm test` and the pre-push hook — today it only runs when someone remembers — `tests/unit/`, maybe refactor script into an exported function — fails when a register entry is deleted — S — n
- [ ] Add `npm run audit:gdpr` to `.githooks/pre-push` / `npm run prepush` until the Vitest wrapper exists — same reason — `.githooks/pre-push`, `package.json` — hook output shows the audit line — S — n
- [ ] Audit scope gaps: `<script src>` / `<iframe>` / `<link rel=preconnect>` in `index.html` and `*.tsx` are not detected as sinks (only `https://` hosts are); `document.cookie` is only checked for presence — `audit-personal-data.ts` §4/5 — a test fixture with an iframe fails — M — n
- [ ] Register `version` bump policy: `698b150`/`a22e629` edited the register without changing `version: 2026-11-10` — add a rule (or a test) that a register diff bumps the version — `data-register.json`, SKILL.md — S — n
- [ ] Gmail mailbox: move `info.fiorevera@gmail.com` to Google Workspace (DPA available) or a HU provider; update privacy `form` body and the launch plan's MX notes — concept §1 item 2 — L (manual, owner) — y
- [ ] Art. 30 record of processing (one-page table: purpose, categories, recipients, retention) — concept §2.1 says the under-250 exemption likely does not apply to non-occasional processing — `docs/gdpr/processing-record.md` — exists, matches register — S — y (owner confirms content)
- [ ] Greetings build slice itself (concept §6 checklist: provider account, DPA, double opt-in, checkbox + helper, new privacy section, consent record, e2e asserting unticked default and payload shape) — `InquiryForm.tsx`, `submitInquiry.ts`, locales, register, `PrivacyPage.tsx` — L — y (provider, transfer path, HU te/ti, frequency ceiling, anniversary opt-out)
- [ ] Re-confirmation mail every 3 years + deletion of non-responders (concept §4) — only once the list exists — provider config — S — y
- [ ] e2e assertion that the inquiry consent checkbox is unticked by default and that the payload contains exactly the 8 declared fields — `tests/e2e/contact.spec.ts` — M — n
- [ ] Concept note §8 honest-critique items the owner has not answered: whether a 5-mail/year list is worth a processor contract at all; whether the anniversary mail should be opt-in separately rather than partial opt-out — y

## 5. Skill updates needed
- `.agent/skills/gdpr-guardian/SKILL.md:38`: "Vercel Web Analytics … **not wired in code**" is false since `698b150` — point to `src/lib/analytics.ts` and add it to "When to use".
- `.agent/skills/gdpr-guardian/SKILL.md:40`: "Form provider not chosen" is false since 2026-11-11 — Web3Forms chosen, key public, personal Gmail still true, processor still unnamed on the privacy page.
- `.agent/skills/gdpr-guardian/SKILL.md` Architecture facts: add Vercel (hosting, IP logs, Hobby DPA [CONFIRM], D8 no lawyer) and the launch plan §7 as a source.
- `.agent/skills/gdpr-guardian/SKILL.md` §3 "whether to involve a lawyer": record D8 (no lawyer; [CONFIRM] tags stay as markers) so the skill stops recommending it every Review Brief.
- `.agent/skills/gdpr-guardian/SKILL.md` §1: say that the audit is not yet part of `npm test` or the hooks (or fix that and delete the sentence).
- `.agent/skills/qa-specialist/SKILL.md`: list `npm run audit:gdpr` among the gates if it is to be enforced.

## 6. Open owner decisions / things only Gabor or Vera can do
- Greetings provider + transfer path: (A) Brevo/MailerLite EU-hosted with DPA — recommended; (B) spreadsheet + BCC — vetoed; (C) own Vercel function — overkill. How the address gets from Web3Forms into A (manual copy vs provider form vs webhook) — concept §5.
- The [CONFIRM] items with no lawyer (D8): Hobby DPA coverage, Grt. § 6 scope for greetings, DE/AT proof standard for double opt-in, retention of consent proof, Art. 30 applicability. Recommendation: one paid hour with a HU data-protection lawyer before the greetings list goes live; the current site can ship without it.
- Mailbox: keep consumer Gmail (no DPA) or move to Workspace / HU provider. Recommendation: Workspace, when the Rackhost transfer (Track B) is done.
- HU voice te/ti for the greetings copy (DE *ihr* is decided).
- Frequency ceiling (proposal: ≤ 4 greetings + 1 anniversary mail per year) and the partial opt-out for the anniversary note.
- R-1 sign-off on the three-locale copy in concept §7 before any of it enters the locale files.

## 7. Friction (what cost time and how to avoid it next time)
- Audit false positives from JSDoc/comments → strip comments before matching (done); write the negative test (remove two register entries, expect 2 findings) first next time.
- Shared checkout with three other sessions: untracked/modified files of siblings in `git status`, a sibling commit landing between push and fetch → always `git status -sb` + `git log origin/..HEAD` before and after push; commit by explicit path list only.
- RTK rewriting `npx` → use `./node_modules/.bin/<bin>`.
- zsh glob quoting in `grep --include=*.tsx` → quote the pattern or use `rg`.
- The brief said "concept only" but the owner later asked whether the privacy page and form were implemented → restate scope and what was deliberately left out in the first Review Brief, not at the end.
- Context compaction mid-push → background long commands (`run_in_background`) and keep the task id + output path in the hand-over note.
