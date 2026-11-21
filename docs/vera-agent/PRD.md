# CMS Coordinator — Product Requirements Document

> **Status: approved by the technical owner on 2026-11-20 with the changes in §0 (G8–G11). Stage 0 (the foundation) was built on 2026-11-21; the pilot with Vera has not started.**
> What exists is described where it lives: the skill `.agent/skills/cms-coordinator/` (its `resources/catalogue.md` is the authoritative list of operations), `scripts/content/`, `scripts/release/publish-content.ts`, `docs/decisions/`. Where this document and the code differ, the code wins.
> Written 2026-11-18 from the `grill-me` interview with Gabor (2026-11-16 and 2026-11-18), following `to-prd`.
> Publish target: local Markdown (`AGENTS.md`, open question 6). Deviation from the `to-prd` template: the
> operations catalogue names files, because the brief asks for "files touched" per operation.

## 0. Decisions from the interview

| # | Question | Decision | Decided by |
|---|---|---|---|
| G1 | Where the agent is used | A Claude Code session with **one dedicated agent and its own skills**. It serves Vera first and Gabor from time to time. It must work wherever the session runs; the visual regression runs **locally**, baselines stay **in the repo**, there is no CI in the deploy path. Vera has a MacBook Air (M4, 13", 2025). | Gabor |
| G2 | Accounts | **One shared family Claude account**, connected to Gabor's GitHub. Commits carry Gabor's git identity. | Gabor |
| G3 | Who puts a content change live | **The agent merges pure content** after the owner's yes, through one script that refuses everything else. Anything outside the catalogue waits for Gabor. | Gabor (recommended option) |
| G4 | Visual gate for content | The **code-based visual review flow from the site-polish session** (`npm run visual:page`, `docs/qa/visual-review-process.md`) is the approval surface; adapt it, do not invent another. | Gabor |
| G5 | Photos | No separate decision needed on a Mac (drag into the chat, or send from the phone into the running session). Cloud photo intake is a stage-2 pilot check. | follows from G1 |
| G6 | German and English | **Vera approves all three languages herself**; she is fluent in Hungarian, German and English. | Gabor |
| G7 | Names | Meaningful role names, no human names: the new agent is the **CMS Coordinator** (`cms-coordinator`). | Gabor |
| G8 | Channel, confirmed | **Option A: the desktop app on Vera's Mac first. No cloud for now.** | Gabor, 2026-11-20 |
| G9 | Technical consultant | A narrow **`tech-lead` skill** is part of this build: it assesses technical questions with at most two options and a recommendation, keeps the decision log `docs/decisions/`, and backs the CMS Coordinator for requests outside its catalogue. | Gabor, 2026-11-20 |
| G10 | Baseline size | The growth of the pixel baselines in git is accepted for now. A reminder in code says after every re-record how large the set and its history are and whether that is still healthy; the clean-up mechanism itself goes to the backlog. | Gabor, 2026-11-20 |
| G11 | The requests R1–R9 (§7) | "Adapt and begin with the build": taken as yes to all nine. R7 (the ruleset on `main`) is the owner's own switch and still open. | Gabor, 2026-11-20 |

| G12 | Strength of the release rules | The agent's permission to put content live stands **if the rules really take effect**. The GitHub ruleset on `main` is active since 2026-11-21 (pull request required, no force push, no deletion). The release script was hardened: it runs every gate itself and no longer accepts a saved result as proof. | Gabor, 2026-11-21 |
| G13 | Who is the human | The Claude account and the GitHub user are shared, so identity is settled twice: a question at the **start of the day** (`goodmorning` routine; an admin proves it with the PIN on any machine) and the approver's **PIN as the last line** before anything goes live. A self-chosen four-digit PIN, typed into a system dialog, never into the chat. Separate GitHub accounts with a code-owners rule are the later, stronger stage. `docs/decisions/0005-who-is-at-the-keyboard.md` | Gabor, 2026-11-21 |
| G14 | Start of the day | A `/goodmorning` command, shaped after the start-of-session routines of the widely used agent repositories (`.agent/skills/goodmorning/resources/sources.md`). | Gabor, 2026-11-21 |

Owner's answers to the critique (§9), 2026-11-20: point 1 agreed, the safe path is wanted; point 2 accepted, a rollback is easy and the risk is small for now; point 3 no concern; point 4 → G10; point 5 "we have to see and improve later if needed"; point 6 fine; point 8 → G8. Point 7 was unclear as written and is reworded below.

## 1. Problem statement

Vera owns the business and the content: the weddings she decorated, the photos, the prices, the words. Since the launch on 2026-11-16 every one of those lives in code: TypeScript data files checked by Zod, three locale files held in parity by a test, images that go through a sharp pipeline, 27 pixel baselines that turn red when a page looks different. There is no CMS, by design (PRD D-14: no backend, no cost). The result is a site that is safe to change and that only Gabor can change. A new album after a wedding, a price for next season, a sentence she no longer likes: each waits for his evening.

Gabor is in the same position from the other side. He built the site in a week with agents and does not want to be the content desk; when he changes content himself he wants the same guidance, because the framework has rules that are easy to break (a count pinned in a test, an image script that rewrites the manifest, a sitemap date that must be refreshed).

Open work that is already waiting on Vera and has no path to her today: the 15 album cover picks, the page-by-page copy sign-off in three languages (R-1), the hero photo pick, and several taste decisions recorded as "owner decision" in `BACKLOG.md` (Hungarian te/ti, emoji in the rental steps, portrait crops).

## 2. Solution

A dedicated agent, the **CMS Coordinator**, that a person talks to in plain Hungarian (or English, for Gabor). It turns one request at a time into a change on its own branch, runs the gates, shows the result on the standard review page, and puts it live after an explicit yes. The person never types a git command and never reads a stack trace.

```
request ─► clarify (one question at a time) ─► branch content/<date>-<what>
        ─► deterministic content script (scripts/content/*)  ─► gates (lint, unit, build, visual, e2e subset)
        ─► review page: Before / After / Difference + the texts in HU · DE · EN
        ─► "OK" on every screen + "Mehet élesbe"  ─► classify (code) ─► content lane: commit, push, pull request, merge
        ─► Vercel deploys main ─► verify the live site ─► one-line confirmation + entry in the change log
```

Three properties carry the design:

1. **Operations are code.** Whatever can be a script is a script with unit tests (`AGENTS.md`: code-first). The model chooses the operation and fills in its arguments; it does not hand-edit `albums.ts`, a locale file or the image manifest.
2. **The agent decides nothing about its own authority.** A classifier script reads the diff and says `content` or `needs-gabor`. The release lane refuses anything that is not `content`.
3. **Approval is a page, not a chat sentence.** The owner's review page (G4) is the only place a look is approved; a script reads the pasted answers and decides what they allow.

## 3. The seven concept questions

### 3.1 Where Vera talks to the agent

**Facts checked in the documentation on 2026-11-16 and 2026-11-18** (sources: code.claude.com/docs pages `claude-code-on-the-web`, `cloud-environments`, `desktop`, `remote-control`, `permission-modes`, `hooks`, `skills`; claude.com/pricing; vercel.com/docs). "Not documented" means I found no statement, not that it cannot work.

| Topic | Desktop app, Code tab, on a Mac | Cloud session (claude.ai/code) |
|---|---|---|
| Plan | Claude Code is a Pro feature: 20 USD/month, or 200 USD/year | Pro, Max, Team |
| To install | The app, Git, Node 22, the clone, `npm ci` (one-time, by Gabor) | Nothing; needs the Claude GitHub App on the repo and a setup script for `npm ci` |
| Photos | Documented: "drag and drop files directly into the prompt". From the phone through Remote Control (Pro plan): "Claude sees attached photos directly as part of your message"; whether the photo also lands as a file on the Mac is **not stated consistently** → pilot check, fallback AirDrop to the Mac and drag in | Not documented that an attachment becomes a file the agent can put into the repo; HEIC is not in the listed upload types |
| Seeing the result | Browser pane on the local production build; the review page as a private Artifact (documented for Pro and above, desktop app 1.13576.0 or later) | Not documented that a session can show images back; Vercel previews answer `302` to a Vercel login (measured by release-manager, 2026-11-18) |
| Pixel baselines | Same platform as the repo set (macOS); parity between two Macs is **not measured yet** | Linux: the Mac set cannot be compared; most screens would show as changed |
| Hooks and guards | Project hooks fire in the desktop app; the git hooks run locally | Project hooks load in single-repo sessions; the git hooks need `npm install` to have run |
| What survives | The clone, the originals in the git-ignored `assets-src/`, the app's session history | Only what is pushed; the VM is reclaimed when idle |
| Deploys | Commits carry Gabor's identity, so Vercel Hobby deploys them | Same, with the shared account (G2) |

**Options.**

- **A. Desktop app on Vera's Mac first, cloud later.** Everything above is documented or already built; the local visual flow (G4) runs unchanged.
- **B. Cloud first.** Needs, before her first real change: a way to get "Before" pictures on Linux (build current `main` and the branch in the same session and feed both to the review page), a proven photo path, and a way to show her the page.
- **C. Gabor's Mac, steered from her phone.** No setup for her, and she depends on his machine being on.

**Honest critique.** B is the nicer promise (nothing to install, works from the phone) and the weaker ground: three of its steps are undocumented and one (pixels) is known not to work as is. Building B first would mean her first sessions test the platform, not her content. A is less elegant and has one unknown I can name and measure in ten minutes: whether the visual suite is green on her Mac on an untouched `main`. C fails the directive "on her own".

**Decided 2026-11-20 (G8): A. The cloud is parked.** My recommendation had been: A, with the agent built channel-neutral. A script (`content:doctor`) reports at session start what the machine can do (platform, baselines usable, photo intake, publishing of the review page, hooks installed, `gh` present) and the agent adapts its offers to it. Stage 2 adds the cloud once the pilot has answered the open points.

**Cost.** One Claude Pro subscription for the family account (20 USD/month). GitHub stays free, Vercel stays on Hobby (owner's standing decision, not re-opened here).

### 3.2 Language and tone

| Rule | In practice |
|---|---|
| The person's language | Vera writes Hungarian; the agent answers in Hungarian, informal *te*, warm and short. Gabor may write English; then it answers in English with the same rules |
| No jargon | Never: branch, commit, merge, deploy, build, baseline, pull request, Zod, i18n, key, lint. Instead: "külön munkapéldány", "elmentettem", "élesítés", "ellenőrzések", "összehasonlító képek" |
| One question at a time | A request with gaps gets the single most important question first, with a suggested answer ("Az album a lista elejére kerüljön? Szerintem igen, mert ez a legfrissebb.") |
| Show, do not tell | Before every approval: the review page (pictures) and, for texts, the three language versions side by side. Never "kész, jól néz ki" |
| At most two options | When there is a real choice, two options with pictures and one marked as the suggestion. She may pick against it; the pick is recorded, not re-argued (rule from the favicon round) |
| Always say where things stand | Every turn ends with one of: "nézd meg és jelölj" · "egy dolgot kérek tőled" · "élesben van" · "Gáborra vár, itt az üzenet neki". And while anything is open: "Az éles oldal közben változatlan." |
| Her words are data | The Hungarian text she dictates goes in as written. The agent may point out a typo or a line that is too long for the page and propose a fix; it does not rewrite her voice |
| Three languages | She writes Hungarian, the agent drafts German and English under the `i18n-guardian` rules (German addresses the couple as *ihr*; no literal idioms), and she approves all three (G6). Her corrections to a draft are applied verbatim |
| Honesty | A failed check is reported as failed, in one sentence, with what happens next. No "almost done" |

Example of the intended voice:

> **Vera:** Felraknám Zsófi és Bence esküvőjét, a képek a Letöltésekben vannak.
> **Agent:** Megvan, 24 képet látok a mappában. Egy kérdés: hol volt az esküvő (helyszín neve és település)?
> **Vera:** Kehida Kapuja, Kehidakustány.
> **Agent:** Köszönöm. Még egy: a pár beleegyezett, hogy a képek és a keresztnevük felkerüljenek az oldalra?

### 3.3 The catalogue of content operations

**As built (2026-11-21):** every operation is a subcommand of one command, `npm run content -- <operation>`, not an npm script of its own; the table's "Script" column names the operation as proposed. The exact names and arguments are in `.agent/skills/cms-coordinator/resources/catalogue.md` and in `npm run content -- help`. Differences from the proposal: photos are `photos-add`, `photos-remove`, `photos-move`; SEO texts go through `text-set`; "what changed lately" is the change log file; `slot-photo` (hero and About) was not built because those photos are owner-only in v1.

Common to every operation, so it is not repeated in the table:

- **Gates** (class `content`): `npm run lint` → `npm test -- --run` → `npm run build` → `npm run test:visual`, then the e2e specs of the touched area on chromium and Mobile Chrome plus `a11y.spec.ts`. The full four-browser run stays the rule for code changes. *(My recommendation; see §7, R6.)*
- **Sitemap dates**: any change to copy or `src/data/**` requires `npm run sitemap`; `public/sitemap.xml` and `scripts/sitemap-lastmod.json` travel with the change (`tests/unit/sitemap.test.ts`).
- **What she approves**: the review page lists exactly the screens that differ, decided by the suite at run time. The "baselines that typically move" column is an expectation, not a promise.
- **Count pins**: several tests pinned the content counts of launch day (§7, R1). Since 2026-11-21 they are derived from the data.

| Operation | Script (proposed) | Files touched | Validation | Tests that guard it | Baselines that typically move | What she sees to approve |
|---|---|---|---|---|---|---|
| **Add an album** from a folder of photos | `content:album-add` | `public/assets/gallery/<id>/*.webp` (3 tiers per photo), `src/data/generated/imageMeta.ts` (that slot only), `src/data/albums.ts`; `gallery.albumTitles.<id>` in 3 locales for a non-couple album; originals copied to the git-ignored `assets-src/gallery/<id>/` | `AlbumSchema` (kebab-case id, partners **or** titleKey, country HU/AT, cover inside the list); unique id; 3–40 photos; long edge ≥ 1600 px (warn) / ≥ 1000 px (refuse); every tier ≤ 200 KB; HEIC converted first (§7, R3); EXIF incl. GPS dropped by the encoder | `data.test.ts`, `assets.test.ts`, `render.test.tsx` (ImageGallery JSON-LD, album sections), `gallery.spec.ts`, `a11y.spec.ts`, layout invariant "no distorted image" | `gallery-375/1280`, `carousel-slide2-*` if it becomes the first album; `home-*` if it is featured | The album on the gallery page at phone and desktop width, the cover, the title and venue in three languages |
| **Reorder albums** | `content:album-move` | `src/data/albums.ts` (array order) | every id still present exactly once | `data.test.ts`, `gallery.spec.ts` | `gallery-*`, `carousel-slide2-*` when the first album changes | The new order as a numbered list with covers; the top of the gallery page |
| **Remove an album** | `content:album-remove` | `src/data/albums.ts`, `public/assets/gallery/<id>/`, `imageMeta.ts`, a `gallery.albumTitles.<id>` key if present; refuses while the id is in `featuredAlbumIds` until a replacement is named | at least one album remains; featured ids still resolve | as for add | as for add | Which album goes (cover and name) and the page without it; a confirmation that names the number of photos removed |
| **Add / remove / reorder photos** in an album | `content:album-photos` | that album's folder in `public/assets/gallery/`, `imageMeta.ts` (that slot), `coverIndex` in `albums.ts` re-pointed so the same photo stays the cover | as for add; the cover photo cannot be removed without naming a new one | `data.test.ts` (cover inside the list), `assets.test.ts` | `carousel-slide2-*`, `gallery-*` for the first album | The album's photos as a numbered contact sheet, before and after |
| **Pick a cover** | `content:album-cover` | `coverIndex` in `src/data/albums.ts` | index inside the album's photo list; photos are numbered from 1 for her | `data.test.ts` | `gallery-*` (first album), `home-*` (featured albums) | The album's photos as a numbered contact sheet; she answers with a number. This closes the open item "Vera picks the 15 covers" |
| **Featured albums** on the home page | `content:album-feature` | `featuredAlbumIds` in `src/data/albums.ts` | exactly four ids that exist | `data.test.ts` | `home-375/1280`, `home-de-375`, `home-en-375` | The home page teaser with the four covers |
| **Change couple names or venue** | `content:album-edit` | `partners` / `venue` in `src/data/albums.ts`; the id (and so the URL anchor and image folder) stays | two non-empty first names; never a joined string ("és" comes from `gallery.and`) | `data.test.ts`, `render.test.tsx` | `gallery-*` when it is the first album | The heading in three languages ("Zsófi és Bence" / "und" / "and") |
| **Change a text** on any page | `content:text-find` then `content:text-set` | the same key in `src/i18n/locales/{hu,de,en}.json` | parity (all three or none); placeholders identical (`{{count}}`…); no empty value; not identical in all three unless whitelisted; no legacy typo; garden only under `about.garden.*`; typography per locale (quotes, spaced en dash); class check: `privacy.*` and `contact.form.consent*` are legal text → `needs-gabor` | `i18n.test.ts`, `render.test.tsx`, `navigation.spec.ts` (leaks), layout invariants (overflow, clipped text, wrapped one-word links) | the two HU baselines of that page; `home-de/en-375` for home texts. DE/EN inner pages have no pixel baseline | The page before and after, and the three versions side by side as text. `content:text-find` answers "which key does this sentence on this page come from" by rendering the routes, because an edit once went to the wrong key (`gallery.intro` instead of `gallery.hero.intro`) |
| **Rental item: price, deposit, quantity, size** | `content:rental-set` | `src/data/rentalItems.ts` | `RentalItemSchema` (positive whole forints; unit one of occasion, piece, set, wall) | `data.test.ts`, `render.test.tsx`, `rental.spec.ts` | `rental-375/1280` when the item is in the clip | The item card before and after with the formatted price ("19 990 Ft") |
| **Rental item: add or remove**, its texts and photos | `content:rental-add`, `content:rental-remove` | `src/data/rentalItems.ts`, `rental.items.<id>.{name,description,notes}` in 3 locales, `public/assets/rental/<id>/`, `imageMeta.ts` (that slot) | schema; all text keys in three locales; at least one photo | as above | `rental-*` | The new card at both widths, texts in three languages |
| **Testimonials: add, remove, reorder** | `content:testimonial` | `src/data/testimonials.ts`, `testimonials.<id>` in 3 locales | `TestimonialSchema`; the quote is the customer's own words (the agent asks; typo fixes only); the customer agreed to be named | `data.test.ts`, `render.test.tsx` | `home-*` if the block is inside the clip | The testimonial block on the home page; the quote in three languages |
| **Contact data**: phone, e-mail, Instagram, Facebook | `content:contact-set` | `src/data/contact.ts` (`phoneDisplay` and `phoneHref` together) | `ContactSchema`; phone display and `tel:` link describe the same number; the e-mail also appears in `privacy.*` texts and the form provider's settings → a changed e-mail is `needs-gabor` | `data.test.ts`, `render.test.tsx` (JSON-LD), `contact.spec.ts`, `audit:gdpr` | `contact-*`, and the footer on short pages (`notfound-*`, `privacy-*`) | Contact page and footer, before and after |
| **Service areas** (local SEO list per language) | `content:areas-set` | `src/data/serviceAreas.ts` | `ServiceAreasSchema` (at least one per locale) | `data.test.ts`, `render.test.tsx` | footer on short pages | The footer line in three languages; one sentence on what it does for search |
| **SEO titles and descriptions** | `content:seo-set` (a guarded form of `text-set`) | `meta.<page>.{title,description}` in 3 locales | title ≤ 60 characters, description 70–160, unique per page, in the page's language (`seo-expert`) | `i18n.test.ts`, `render.test.tsx`, `seo.spec.ts` | none | A search-result mock-up (title, address, description) per language, with the character count as "belefér / 4 karakterrel hosszabb" |
| **Seasonal announcement**, **opening information** | not available yet | no data model and no component exist today | — | — | — | The agent says so and offers the two things that exist: a sentence in an existing text block, or a request to Gabor to build an announcement strip once (§8) |
| **Hero and About photos** | `content:slot-photo` | `public/assets/{hero,about}/`, `imageMeta.ts` (that slot) | as for album photos; the hero is the largest picture on the page and the social-share image | `assets.test.ts`, `data.test.ts`, `vitals.spec.ts` | `home-*`, `about-*` | **`needs-gabor` in v1**: the hero decides first impression and loading speed; she picks, he releases |

Read-only helpers, no approval needed: `content:list` (albums, items, testimonials as she would name them), `content:show <thing>` (current value in three languages), `content:history` (what went live, when, approved by whom), `content:doctor`.

### 3.4 The safety model

Built on `release-manager` as merged on 2026-11-18 (guards on `main`, `content/` branch prefix, `release:status`, `release:cleanup`, `verify:live`), with **one written exception**: the content lane.

| Step | What happens | Enforced by |
|---|---|---|
| 1. Start | `release:status` must be clean; `git fetch`; `git switch -c content/<date>-<what> origin/main`. One open change at a time; an unfinished one is offered first ("Tegnap félbemaradt az árváltoztatás. Folytassuk?") | existing guards (no edit on `main`) |
| 2. Change | Only through `scripts/content/*`. Each script validates before it writes and leaves the tree untouched when validation fails | the scripts' own unit tests |
| 3. Gates | The chain from §3.3 through `npm run content:gates`: one machine-readable result per gate (name, pass, fail or review, the last lines of a failure) for exactly this state. The agent uses it to know whether there is something to show; the release script does not accept it as proof and runs every gate again itself (hardened 2026-11-21, G12) | `scripts/content/gates.ts` |
| 4. Review | `npm run visual:page` with a Hungarian review spec; published as a private Artifact where the session can, otherwise served locally. She marks every screen OK or Issue and presses "Copy answers" | `docs/qa/visual-review-process.md` (G4) |
| 4b. Who approves (added 2026-11-21, G13) | The release script asks for the approver's PIN in a system dialog, after its own run of every gate and immediately before the merge. Whose PIN: whoever said "it is me" in the morning routine | `scripts/release/operator.ts`; three wrong entries lock the person for five minutes |
| 5. Approval | The pasted answers are read by `visual:page -- --answers`, never by eye. "May re-record" only if every screen is OK, the look is approved and the answers belong to exactly these pictures. "May go live" only if, in addition, the go-live answer is yes | existing script; build fingerprint in the answers |
| 6. Classify | `content:classify` reads the diff against `origin/main` and prints `content` or `needs-gabor` with reasons (path allowlist plus key-level rules inside the locale files) | new script, unit-tested with fixtures of both classes |
| 7. Release | Class `content`: **one script** (`npm run release:publish-content`) establishes steps 6, 3 and 5 itself for the current state, asks for the approver's PIN as the last line (step 4b), then re-records the baselines under that person's name, commits, pushes (the pre-push hook runs four gates once more), opens and merges the pull request. Class `needs-gabor`: commit and push only; hand-over (§3.6) | new script; GitHub ruleset on `main` (pull request required, no direct push); Bash guard rule that denies a typed `gh pr merge` |
| 8. Live check | Wait for the Vercel production deployment, then `npm run verify:live`. Only then: "Élesben van." with the page link | existing `verify:live` |
| 9. Record | One line in `docs/vera-agent/changelog.md`: date, what changed in her words, who approved, commit | the release script |

**How this maps to the two GOs.** `release-manager` says: GO 1 = commit and push, GO 2 = the owner merges, never collapsed. In the content lane both are still separate answers by a human, on the same page: "the new look is right" and "put it live". What changes is who presses the button: the script, on her recorded answer. This must be written into `release-manager` as an exception for class `content` only; the sentence "the agent never merges and cannot" stays true for everything else.

**Rollback in one sentence.** "Vond vissza az utolsó változtatást" → `content:rollback --last`: a new `content/revert-…` branch, `git revert` of the last content merge, the same gates, the same lane. No new review is needed when nothing else was merged in between, because the state being restored was approved before, and the revert restores the old baseline pictures together with the old content, so the visual gate is green without re-recording. If other changes landed in between or the revert conflicts, it becomes `needs-gabor`. The agent then tells her which change was undone, in the words of the change log. Vercel's Instant Rollback stays Gabor's emergency switch (it only reaches the previous deployment and pauses auto-deploy).

**The second gate (Gabor).** Everything the classifier does not recognise as catalogue content: components, styles, layout, `scripts/`, tests, dependencies, `vercel.json`, routes and slugs, legal texts (`privacy.*`, consent texts, `PRIVACY_UPDATED`), the data register, postal address and owner name, the hero photo (v1), a changed e-mail address, anything touching the form. Default is `needs-gabor`: a new file or key the classifier has never seen is not content until the allowlist says so.

**What the shared account means.** The account does not say who is working (G2). Since 2026-11-21 "approved by Vera" in the change log means: her PIN was typed into the system dialog on that machine (G13). That tells the two owners apart; it is not a wall against an agent that avoids the release script, which is why separate GitHub accounts are the next stage.

### 3.5 Design and technical advice

When she asks for an opinion ("jó ez a borítókép?", "nem túl hosszú ez a szöveg?", "miért nem talál meg a Google Keszthelyre?") or when a change touches a specialist's ground, the CMS Coordinator consults the specialist skills itself and answers her with a plain recommendation.

| Her question or change touches | Skill consulted | What it checks for her | How the finding reaches her |
|---|---|---|---|
| A photo: cover, crop, order, quality | `design-system-expert` | 3:2 carousel crop of portrait shots, cover that reads at phone size, mood (linen, sage, blush, gold), file size | "Ez a kép álló formátumú, a lapozóban a teteje és az alja lemarad. A 7-es kép ugyanezt mutatja fekvőben; azt javaslom." with both pictures |
| A text: length, fit, tone | `i18n-guardian`, `design-system-expert` | German runs about 30 % longer; buttons and menu items must stay on one line at 320 px; register of the surrounding strings | The page at phone width with the new text; if it wraps, a shorter variant as the second option |
| Being found: titles, descriptions, service areas | `seo-expert` | Length limits, one topic per page, local terms, no change to addresses of pages | A search-result mock-up and one sentence on what the change can and cannot do |
| Anything a visitor must be able to read or operate | `accessibility-expert` | Contrast, alt text templates, heading order (via the axe run) | Only when something fails, as a plain consequence: "Ezt a szöveget ezen a háttéren sokan nem tudják elolvasni." |
| Names and faces of customers, e-mail addresses, forms | `gdpr-guardian` | Consent of the couple before an album or a testimonial; nothing that stores visitor data is content | A yes/no question before the change; legal points are passed to Gabor with the skill's [INFO] / [CONFIRM] tags |
| "Is it safe to put live?" | `qa-specialist`, `release-manager` | The gate results | One line: all checks passed, or which one did not and what happens next |
| "Can the site do this?", a new kind of content, how something is built (G9) | `tech-lead` | The standing constraints (static site, no backend, three languages, gates), cost and risk of at most two options | What exists, what it would take, and that the decision is Gabor's; the same assessment goes into the message she forwards to him |

Rules for the translation from specialist to owner: at most two options; always a recommendation, with the reason in one sentence about the visitor, not about the code; pictures of the real page with the option applied, never a description; a specialist's veto (contrast, consent, file size) is not offered as an option at all; her pick is final for taste, and a pick against the recommendation is recorded once without comment.

### 3.6 What it refuses or escalates, and how a failed gate is explained

**Refuses (says no, explains in one sentence, offers what is possible instead).** Skipping or weakening a check; re-recording comparison pictures to get past a red result; putting anything live without the answers from the review page; publishing photos or names of people without the consent question answered yes; inventing or rewording a customer's testimonial; copying text or pictures from other websites; storing passwords or keys; deleting several albums in one go without naming each.

**Escalates to Gabor (`needs-gabor`).** The list in §3.4, and: anything that needs a new kind of content (announcement strip, opening hours, EUR prices, blog, newsletter), domain, hosting, e-mail delivery, a check that stays red after one honest attempt to fix the content, a rollback that conflicts, and every case where the agent is not certain which of the two classes applies.

**How an escalation is delivered.** The work is not lost: the change stays on its branch, pushed. The agent writes a short message for Gabor (what she wants, in her words; what was prepared; the comparison link; what he has to decide) and shows it to her as text to forward. It also adds an entry to `docs/vera-agent/changelog.md` with the state "Gáborra vár". It never says "szóltam Gábornak": it has no channel of its own to him, and with the shared account a GitHub pull request does not notify him either.

**Failed gates in human terms.** The agent first tries the fix that is its own job (re-encode a photo, shorten a slug, refresh the sitemap dates), once. Then:

| Gate result | What she is told | What happens next |
|---|---|---|
| A photo is too small or cannot be read | "A 12-es kép túl kicsi ahhoz, hogy élesen jelenjen meg. Van belőle nagyobb változatod?" | She sends another file, or the album goes ahead without it |
| A text is missing in one language, or a placeholder was lost | Nothing; the agent repairs its own draft | Re-run |
| SEO title or description too long | "A cím 4 karakterrel hosszabb, mint ami a Google találatban elfér. Rövidebb javaslat: …" | She picks or rewrites |
| Layout check: text overflows or a word breaks badly at a phone width | "Telefonon ez a sor kilóg a képernyőről. Két megoldás: rövidebb szöveg (javaslom), vagy megkérjük Gábort, hogy igazítson az elrendezésen." | Shorter text now, or `needs-gabor` |
| Accessibility check red | "Ezt így sok látogató nem tudná elolvasni vagy kezelni, ezért nem tehetem ki." plus the concrete fix when it is content | Fix, or `needs-gabor` when it is design |
| Build or an unexpected test fails | "Valami olyasmi akadt el, ami nem a te változtatásodon múlik. Az éles oldal változatlan, a munkád el van mentve. Ezt küldd el Gábornak: …" | `needs-gabor` with the gate's raw result attached for him |
| The live check after release fails | "Az élesítés nem ment végig rendesen, ezért visszaállítom az előző állapotot." | Automatic rollback through the same lane, then `needs-gabor` |

She is never left with a red result and no next step, and never asked to read a log.

### 3.7 Staged rollout

**Stage 0: foundation (buildable now, without Vera).**

1. Skills: `cms-coordinator` (persona, dialogue rules, escalation, routing to the specialists) and the operations catalogue as its resource file.
2. `scripts/content/` with unit tests: the shared pieces first (`classify`, `doctor`, `gates`, safe editors for the data files, slot-scoped image intake), then the operations in pilot order: `rental-set`, `album-cover`, `text-find` / `text-set`, `testimonial`, `album-add`, the rest.
3. The one-page Hungarian guide (`docs/vera-agent/utmutato.md`) and the change log file.
4. Registry updates last, after rebasing on `main`.
5. The requests in §7 that Gabor accepts.

**Stage 1: pilot with Vera on her Mac.** Set-up by Gabor first (about an hour): family account in the desktop app, clone, `npm ci`, hooks installed, `gh` signed in, the `main` ruleset on GitHub, then `content:doctor` and `npm run test:visual` on an untouched `main`. **That last run is the first measurement of the pilot**: if two Macs do not render the same pixels, the review page must take its "Before" pictures from a build of `main` on the same machine (already designed, §3.1 B) before she starts.

Her first session, in rising order of risk, each a real piece of open work where possible:

| # | Task | Proves |
|---|---|---|
| 1 | "Mit tudsz nekem segíteni?" | She understands the offer; nothing changes |
| 2 | Change one rental price, put it live, undo it with one sentence, do it again | The whole loop and the rollback, on the smallest possible change |
| 3 | Pick the covers of the 15 albums | The contact-sheet dialogue; closes the oldest item waiting on her |
| 4 | Correct one sentence on the About page in three languages | Translation drafts and her approval of all three; starts the R-1 sign-off page by page |
| 5 | Add one testimonial | The consent and verbatim questions |
| 6 | Add one real album from phone photos | Photo intake incl. iPhone format, covers, names in three languages |
| 7 | Ask for something outside the catalogue ("legyen nagyobb a logó") | The escalation message she forwards |
| 8 | A request that must fail (a far too long page title) | A failed check explained without leaving her stuck |

**Stage 2: the cloud as a second channel — parked by the owner on 2026-11-20 (G8).** If it is taken up later, it starts with these checks in one throw-away session by Gabor: does an attached phone photo become a file; can the session show her the review page; do the hooks and the content lane work there; how long a cold start takes. Text and price changes come first; photo work moves only if intake is proven.

**How success is measured.**

| Measure | Target after four weeks |
|---|---|
| Content releases Vera completed without Gabor touching anything | at least 3, including one album |
| Time from her first message to "élesben van" | text or price ≤ 15 minutes, album ≤ 40 minutes |
| Production incidents caused by a content release (live check red, or a rollback she did not ask for) | 0 |
| Bypasses (`FV_SKIP_HOOKS`, re-recording without answers, a merge outside the lane) | 0, checked from the change log and git history |
| Escalations that were avoidable (the catalogue should have covered it) | each one becomes a catalogue entry or a note why not |
| Her own verdict, asked once at the end of each session ("1-től 5-ig mennyire volt könnyű?") | 4 or better, and she starts the next session unprompted |
| Open owner items closed through the agent | covers picked; copy sign-off of at least two pages |

## 4. User stories

1. As Vera, I want to describe a change in my own Hungarian words, so that I do not have to learn how the site is built.
2. As Vera, I want to be asked one question at a time with a suggested answer, so that I can reply from my phone between two tasks.
3. As Vera, I want to add a new wedding from a folder of photos, so that fresh work appears on the site the week it happened.
4. As Vera, I want to see every photo of an album numbered on one sheet, so that I can pick the cover by saying a number.
5. As Vera, I want to reorder the albums, so that my best and newest work is seen first.
6. As Vera, I want to remove an album, so that a couple who asks to be taken down is gone the same day.
7. As Vera, I want to add, remove and reorder photos inside an album, so that weak shots do not stay online.
8. As Vera, I want to correct the names of a couple or a venue, so that nobody is misspelled on my site.
9. As Vera, I want to choose which four albums appear on the home page, so that the first impression follows the season.
10. As Vera, I want to point at a sentence on a page and say what it should say, so that I do not need to know where texts are stored.
11. As Vera, I want German and English drafts next to my Hungarian, so that I only correct instead of translating from scratch.
12. As Vera, I want my corrections to a translation taken exactly as I wrote them, so that the German sounds like me.
13. As Vera, I want to change a rental price, deposit or quantity, so that the price list is right before the season starts.
14. As Vera, I want to add a new rental item with photos and texts, so that a newly bought prop can be booked.
15. As Vera, I want to retire a rental item, so that nobody asks for something I no longer have.
16. As Vera, I want to add a testimonial a customer sent me, so that new praise is not stuck in my inbox.
17. As Vera, I want to change my phone number or social links in one place, so that the contact page, the footer and the search data agree.
18. As Vera, I want to see how a page title and description will look in a search result, so that I can judge them without knowing length rules.
19. As Vera, I want to see before and after pictures of every page that changes, at phone and desktop width, so that I approve what visitors will really see.
20. As Vera, I want to mark a screen as "not right" with a note, so that the agent fixes it and shows me again.
21. As Vera, I want nothing to reach the live site until I have said yes, so that I can try things without fear.
22. As Vera, I want to be told plainly when the change is live, with a link, so that I can check it on my phone.
23. As Vera, I want to undo the last change with one sentence, so that a mistake costs me a minute.
24. As Vera, I want to ask what changed recently, so that I remember what I did last month.
25. As Vera, I want to continue an unfinished change the next day, so that an interruption does not lose my work.
26. As Vera, I want advice on which photo or wording works better, with at most two options and a recommendation, so that I can decide quickly.
27. As Vera, I want to be told when something I ask for needs Gabor, with a ready message for him, so that I am not left guessing.
28. As Vera, I want a failed check explained by its consequence for visitors, so that I understand why the agent will not do it.
29. As Vera, I want to be asked whether the couple agreed before their photos go online, so that I do not publish someone against their wish by accident.
30. As Vera, I want a one-page guide in Hungarian, so that I can start a session without asking Gabor how.
31. As Vera, I want to send photos from my phone into the session on my Mac, so that I do not have to move files around first.
32. As Gabor, I want the same agent to guide me through a content change, so that I follow the framework's rules without re-reading them.
33. As Gabor, I want content operations to be scripts with tests, so that a change is the same whoever asks for it.
34. As Gabor, I want a script, not the model, to decide whether a change is pure content, so that the agent cannot talk itself into releasing code.
35. As Gabor, I want everything outside the catalogue to stop and wait for me, so that layout, dependencies and legal texts stay under my review.
36. As Gabor, I want every content release recorded with date, approver and commit, so that I can see what went live while I was away.
37. As Gabor, I want the visual approval to use the one review page and its answer format, so that no session invents its own way of approving a look.
38. As Gabor, I want `main` to be unreachable except through the release lanes, so that a confused session cannot push to production.
39. As Gabor, I want the agent to report at session start what this machine can and cannot do, so that a missing tool is found before Vera is in the middle of an album.
40. As Gabor, I want the image manifest protected from the global image script on a machine without the full originals, so that one command cannot empty the gallery.
41. As Gabor, I want the escalation to arrive as a prepared branch with a summary, so that my part is a review, not a reconstruction.
42. As a wedding couple, I want my photos and first names published only with my agreement and removed when I ask, so that my wedding is not used against my wish.
43. As a visitor, I want every content change to keep the site fast, readable and correct in my language, so that I never notice how it is maintained.

## 5. Implementation decisions

**Modules.**

| Module | Responsibility | Interface (deep module, small surface) |
|---|---|---|
| `cms-coordinator` skill | Persona, dialogue rules, escalation rules, routing to specialists, the catalogue as a resource table that maps a request to one script | Prose; no git or validation logic of its own |
| Data editors | Read and write `albums.ts`, `rentalItems.ts`, `testimonials.ts`, `contact.ts`, `serviceAreas.ts` as data: parse → validate with the existing Zod schema → change → validate → print back in the file's existing style | `load(file)`, `save(file, data)`; refuses to write what the schema rejects |
| Locale editor | Set, add, remove a key in all three locale files in one step, preserving key order | `setText(key, {hu, de, en})`; runs `validateLocales` and the typography rules before writing |
| Text finder | "Which key does this visible sentence on this page come from": renders the routes through the existing server entry and maps strings to keys | `findText(phrase, page?) → [{ key, routes }]` |
| Image intake | One slot only: encode the three tiers with the pipeline's own limits, name files as the pipeline does, merge that slot into the manifest, never touch another slot | `ingest(slot, sourceFolder)`, `removeFromSlot`, `reorderSlot` |
| Classifier | Diff against `origin/main` → `content` or `needs-gabor` with reasons | `npm run content:classify`; exit code carries the class; allowlist is data, not code |
| Gate runner | Run the content gate chain, stop at the first failure, write a per-commit result with the first failing assertion as text | `npm run content:gates -- --json` |
| Doctor | What this machine can do; refuses to start a change when a hard requirement is missing | `npm run content:doctor -- --json` |
| Change log | Append-only Hungarian record | written only by the release and rollback scripts |
| Content lane | The single door to `main` for class `content` | `npm run release:publish-content`; re-checks gates, answers and class for the current commit |

**Decisions.**

- **Two sanctioned writers for the image manifest.** `imageMeta.ts` stays "generated, never hand-edited". The global script regenerates everything from `assets-src/`; the intake regenerates one slot from the committed files plus the new photos. They must share one encoder so the limits cannot drift (§7, R2).
- **The committed WebP files are the source of truth for existing photos.** Originals are an archive on the machine that added them (`assets-src/`, git-ignored). The repo is public; originals are never committed.
- **Data files stay TypeScript.** Moving content to JSON would simplify the editors but changes site code and imports; out of this branch's scope and not needed.
- **Human numbering starts at 1** in every dialogue and on every contact sheet; scripts convert to the 0-based `coverIndex`.
- **New albums go to the top of the gallery by default** and the agent asks; the home-page selection changes only on request.
- **Slugs are derived once and never change** (accents folded, kebab-case): they are URL anchors and image folders.
- **Who is at the keyboard** (changed 2026-11-21, G13). The `goodmorning` routine asks once a day; the release script asks that person for their PIN and records their name. `docs/decisions/0005-who-is-at-the-keyboard.md`.
- **How it becomes a dedicated agent** (documentation checked 2026-11-18, `sub-agents`, `skills`, `hooks`):
  - The rules live in `.agent/skills/cms-coordinator/` as the registry requires. Claude Code only discovers project skills under `.claude/skills/`, so a thin `.claude/skills/cms-coordinator/SKILL.md` points to it and makes it invocable by name.
  - A project agent definition `.claude/agents/cms-coordinator.md` carries the persona and preloads that skill ("Use the `skills` field to inject skill content into a subagent's context at startup").
  - Documented: "To make it the default for every session in a project, set `agent` in `.claude/settings.json`". Set in the committed file, that would turn every technical session into the CMS Coordinator too. So the key goes into the **git-ignored `.claude/settings.local.json` on Vera's Mac only**: her sessions start as the CMS Coordinator, Gabor's stay as they are and he calls it by name when he wants it.
  - Not documented: whether the desktop app's Code tab honours the `agent` key. Pilot set-up check. The fallback that certainly works is typing the skill's name once at the start, and the guide says so.
- **The coordinator persona is renamed.** In `AGENTS.md` the persona "Vera" becomes "the Project Coordinator" (G7), so "Vera" means only the person. The skill and the documents use `cms-coordinator`; the folder `docs/vera-agent/` keeps its name as given in the brief.
- **Review page in Hungarian.** The page gets a language switch and plain wording for its two closing questions ("Jó így az új kinézet?" / "Mehet élesbe?"); the answer format underneath stays as it is, so one script reads both languages (§7, R4).

## 6. Testing decisions

- **A good test here checks what an operation leaves on disk, not how it got there**: given a fixture copy of the data files, the locale files and a few small test images, run the operation and assert the resulting data validates against the real schemas, the three locale files are in parity, the manifest slot matches the files, and nothing outside the operation's declared files changed.
- **Every operation has a refusal test**: invalid input leaves the fixture byte-identical.
- **The classifier is tested with both classes**: fixtures of pure content diffs (must be `content`) and of look-alikes (a locale change touching `privacy.*`, a new file under `src/`, a changed test) that must be `needs-gabor`. Unknown paths default to `needs-gabor`.
- **The image intake is tested against the pipeline**: the same source photo through the global script and through the intake yields the same file names, tiers and size limits.
- **Idempotence**: running an operation twice with the same input changes nothing the second time.
- **Prior art**: `tests/unit/data.test.ts` (schemas against data), `tests/unit/i18n.test.ts` (negative cases built in memory), `tests/unit/assets.test.ts` (files on disk against the manifest), `tests/unit/skills.test.ts` (registry drift), `scripts/release/selftest.sh` (forbidden moves replayed in a throw-away repository; the content lane's refusals belong there).
- **Not unit-tested**: the dialogue. It is exercised by the pilot task list (§3.7) and judged by the measures there.

## 7. Requests outside this branch's scope limits

**Owner's answer 2026-11-20 (G11): all nine taken as yes and built on 2026-11-21, except R7, which only the owner can switch.** How each was done: `BACKLOG.md`.

The brief limited this branch to `docs/vera-agent/`, the skill folder, `scripts/content/`, its unit tests, `package.json` scripts and the registry files. The concept needed the following beyond that.

| # | Request | Why it is needed | Smallest form |
|---|---|---|---|
| R1 | Replace the pinned content counts in `tests/unit/data.test.ts`, `tests/unit/render.test.tsx`, `tests/e2e/gallery.spec.ts`, `tests/e2e/rental.spec.ts` (15 albums, 169 photos, 7 rental items, 4 testimonials, 16 ImageGallery nodes, mirror deposit 20 000) by values derived from the data | The first added album or item turns the gate red although nothing is wrong | Assertions like "one section per album" and "ImageGallery count = albums + 1" |
| R2 | Let `scripts/optimize-images.js` and the intake share one encoder module, and make the global script refuse to run when `assets-src/` lacks a slot that the manifest contains | Today the global script rebuilds the manifest from whatever folders exist and deletes the rest; on Vera's Mac that would empty the gallery | Extract the encode functions; add the refusal |
| R3 | A way to read iPhone photos (HEIC). The installed sharp build reads `.avif` only for that family (measured 2026-11-16) | Her phone photos would otherwise fail at intake | On a Mac: convert with the system's `sips` (no dependency). A new dev dependency only if the cloud stage needs it |
| R4 | Hungarian mode and an approver line on the review page (`scripts/visual-review-page.ts`) | The page ends in `BASELINES YES/NO`, `COMMIT GO/WAIT`; she needs plain Hungarian | A language flag; answer format unchanged |
| R5 | The content lane in `release-manager`: `scripts/release/publish-content`, a Bash guard rule against a typed `gh pr merge`, a selftest case, a section in the skill; `gh` installed and signed in on the Macs that use it | G3: the agent merges pure content; today the skill says it never merges and there is no `gh` | One script, one guard rule, one skill section |
| R6 | Agree the gate set for class `content`: unit, build, visual, plus e2e on chromium and Mobile Chrome for the touched area and the axe spec; the four-browser run stays for code | Four browsers take minutes per release and content cannot break browser-specific behaviour that the two projects do not show | A documented rule in `qa-specialist` |
| R7 | Owner switches: the GitHub ruleset on `main` (already listed in `release-manager` §8) | The content lane relies on it as the wall behind the scripts | Gabor, in GitHub settings |
| R8 | Rename the persona in `AGENTS.md` and the two skill lines that mean the persona (`skill-creator`: "Vera's registry"; `goodbye`: "Vera's session-close checklist") | G7 | Part of the registry step, plus two one-line edits outside it |
| R9 | Two files under `.claude/`: the agent definition `.claude/agents/cms-coordinator.md` and the pointer skill `.claude/skills/cms-coordinator/SKILL.md` | G1 asks for a dedicated agent; the brief's scope names only `.agent/skills/` | Two small files; no change to `.claude/settings.json` or the hooks |

## 8. Out of scope

- A hosted CMS, a database, an admin page, a login on the site (PRD D-14 stands).
- New kinds of content: announcement strip, opening hours, EUR prices, blog, Instagram feed, newsletter. Each is a feature for Gabor; the agent recognises the wish and passes it on.
- Changing layout, styles, components, routes, dependencies or tests through this agent.
- Legal texts and anything that stores visitor data.
- CI. The gates run where the session runs (G1).
- Replacing the whole legacy photo set in one go (a bulk job for Gabor's Mac, where the full originals are).
- The cloud channel before the stage-2 checks.

## 9. Honest critique

1. **This is a heavy way to change a price.** A branch, four gates, a review page and a merge for one number. A git-based CMS with a form (Decap, Tina) would do text and prices faster and without a model. I still recommend the agent: it also covers what a form does not (photo intake, three languages, the visual approval, advice), it adds no service, and the heavy path is what keeps a public production site safe with a non-technical operator. If after the pilot most of her changes are prices and single sentences, the form deserves a second look.
2. **The content lane gives an agent a door to production.** That is new, and the opposite of what `release-manager` promised two days ago. The mitigation is that every condition is checked by code for the exact commit, the door is one script, and the wall behind it is GitHub's ruleset. What no gate can catch is content that is valid and wrong (a mistyped price, the wrong couple's photo). The only defence is her look at the review page, and a rollback that costs one sentence.
3. **The approval is not authenticated** (shared account). Stated in §3.4; acceptable for a family, not for anything larger.
4. **Pixel baselines in git grow with every content release.** Each changed screen is a new PNG of a few hundred kilobytes in history. With weekly releases that is tens of megabytes a year. Watch the repo size; Git LFS is already on the backlog.
5. **Two Macs may not render identical pixels.** Unmeasured. It is the first pilot check, and the fallback is designed.
6. **The first real album will hit R1.** If R1 is declined or delayed, the catalogue's most wanted operation ends in an escalation every time. R1 and R2 are prerequisites, not extras.
7. **How the agent talks cannot be tested by code.** The rules for talking to Vera (plain Hungarian, one question at a time, never leave her without a next step) are written instructions. Everything else in this concept is checked by a script or a test; this part is checked only by watching it. The agent may still word something clumsily or ask two questions at once. That is why pilot tasks 7 and 8 exist: their only purpose is to see how it behaves when it has to say no, and every misstep becomes a model sentence in the skill's dialogue file.
8. **Channel.** Settled on 2026-11-20 (G8): the Mac first, no cloud for now.
9. **The content lane has never run end to end** (added 2026-11-21). Its refusal rules are unit-tested; its git and GitHub steps need `gh`, which is not installed on the machine it was built on. The first real run must be supervised, on the smallest change (pilot task 2).

## 10. Open points and things not verified

| Point | State |
|---|---|
| Visual suite green on Vera's Mac on untouched `main` | not measured; pilot set-up step |
| A photo attached in a cloud session becomes a usable file; HEIC accepted | not documented; stage-2 check |
| A cloud session can show the review page or pictures to the user | not documented; stage-2 check |
| The Artifact route for the review page on the family account | documented for Pro and above with a current desktop app; to confirm once on the new account |
| The desktop app honours the `agent` key in `.claude/settings.local.json` | not documented; pilot set-up check; fallback is calling the skill by name |
| A photo sent from the phone through Remote Control is a file on the Mac | documentation is not consistent; pilot check; fallback AirDrop and drag |
| Vercel Hobby and commit authorship | holds with G2 (Gabor's identity); would need re-checking if Vera ever gets her own GitHub account |
| Hungarian te/ti, emoji in the rental steps, portrait crops, hero photo | owner decisions still open in `BACKLOG.md`; the pilot is the natural place for Vera to make them |
| The content lane's git and GitHub steps | unit tests cover the refusal rules only; first real run is pilot task 2, supervised |
| `gh` on the machines that publish | not installed on Gabor's Mac on 2026-11-21 (`npm run content:doctor` → `canPublish: false`); one-time set-up |
