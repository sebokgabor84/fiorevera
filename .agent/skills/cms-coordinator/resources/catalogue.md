# Content catalogue — what can be asked for, and the operation behind it

Every operation is `npm run content -- <operation> …` (`scripts/content/cli.ts`). It answers with one JSON object: `{ ok: true, changed: [...] }` or `{ ok: false, code, message }`. Nothing is written when it refuses. `--dry-run` checks without writing. `npm run content -- help` lists every operation with its arguments. Numbers a person gives are 1-based (photo 1 is the first photo).

Ids (`orsi-anti`, `wooden-arch`) come from `list`. An id never changes: it is the page anchor and the photo folder.

## Looking, never changing

| They ask | Command | Use |
|---|---|---|
| "Mi van most fent?" | `list` · `list albums` · `list rental` · `list testimonials` | Names, order, prices, photo counts, which albums are on the home page |
| "Mi van erről kiírva?" | `show <album id \| rental id \| text key \| contact \| areas>` | One thing in all three languages |
| "Melyik szöveg ez?" | `text-find "<a few words>"` | The key of a visible sentence and the pages that show it (`pages` is filled when a build exists: `npm run build`). Always find the key this way; never guess it |
| "Mutasd a képeket" | `sheet gallery/<album id>` · `sheet rental/<item id>` | One picture with every photo numbered, in `.content/sheets/`; show it and let them answer with a number |

## Albums and photos

| They ask | Command | Ask first | Checks (refusal `code`) |
|---|---|---|---|
| New wedding from a folder of photos | `album-add --from <folder> --partners "Zsófi, Bence" --venue-name "…" --venue-town "…" [--country AT] [--cover n] [--position first\|last\|n]` | Venue and town; **did the couple agree to their photos and first names being published**; which photo is the cover (show the sheet afterwards and correct with `album-cover`); top of the gallery? (default: first) | 3 tiers ≤ 200 KB per photo, ≤ 40 photos, long edge ≥ 1000 px (`photo-too-small`), HEIC converted on a Mac, duplicates skipped (`warnings`), id derived from the names |
| Album that is not a couple (shoot, magazine) | `album-add --from <folder> --title-hu "…" --title-de "…" --title-en "…" …` | The title in Hungarian; you draft DE and EN, they approve | `text-missing` when a language is missing |
| Reorder | `album-move <id> --to first\|last\|n` | — | `position-out-of-range` |
| Remove | `album-remove <id> [--replace-featured <id>]` | Name the album and its photo count back and get a clear yes; if it is on the home page, which album replaces it | `album-featured`, `last-album` |
| Cover | `album-cover <id> --photo n` | Show `sheet` first | `cover-out-of-range` |
| Names or venue | `album-edit <id> [--partners "A, B"] [--venue-name "…"\|none] [--venue-town "…"\|none] [--country HU\|AT]` (titled album: `--title-hu/de/en`) | — | Names are two first names; the joiner ("és / und / and") comes from the site |
| Home page selection | `album-feature <id> <id> <id> <id>` | Exactly four, in order | `featured-count` |
| More photos | `photos-add gallery/<id> --from <folder> [--position …]` | — | as for a new album; the cover stays the same photo |
| Remove photos | `photos-remove gallery/<id> --photos 3,5 [--new-cover n]` | Show `sheet`; confirm the numbers | `cover-removed` (name a new cover), `last-photo` |
| Move a photo | `photos-move gallery/<id> --photo n --to n` | — | the cover stays the same photo |

## Texts

| They ask | Command | Notes |
|---|---|---|
| Change a sentence | `text-find "…"`, then `text-set <key> --hu "…" --de "…" --en "…"` | All three languages or nothing. Their Hungarian verbatim; your German and English drafts shown side by side before the change is released. Placeholders (`{{count}}`, `<0>…</0>`) must survive in every language |
| Page title or description for search | the same, on `meta.<page>.title` / `meta.<page>.description` | Title ≤ 60 characters, description 70–160. Show a search-result mock-up per language and the count as "belefér" or "4 karakterrel hosszabb" |

Keys under `privacy.*` and `contact.form.consent*` are legal text: the operation works, the release lane refuses, so do not start; escalate.

## Rental items

| They ask | Command | Checks |
|---|---|---|
| Price, deposit, quantity, size | `rental-set <id> [--price 21990] [--deposit 20000\|none] [--quantity n] [--size "…"\|none]` | Whole forints above zero (`amount-invalid`). Show the card with the formatted price |
| New item | `rental-add --from <folder> --name-hu/de/en … --description-hu/de/en … [--notes-hu/de/en …] --unit occasion\|piece\|set\|wall --quantity n --price n [--deposit n] [--size "…"] [--pickup-town …]` | Texts in three languages, at least one photo |
| Retire an item | `rental-remove <id>` | Confirm by name; `last-item` |
| Reorder | `rental-move <id> --to first\|last\|n` | — |

## Testimonials, contact, service areas

| They ask | Command | Ask first / checks |
|---|---|---|
| New testimonial | `testimonial-add --author "…" --hu "…" --de "…" --en "…" [--position …]` | **Is this what the customer wrote, word for word, and may their name appear?** Typo fixes only. You draft DE and EN |
| Remove / reorder | `testimonial-remove <id>` · `testimonial-move <id> --to …` | `last-testimonial` |
| Phone, Instagram, Facebook | `contact-set [--phone "+36 30 …"] [--instagram https://…] [--facebook https://…]` | International format (`phone-invalid`); the dial link and the Instagram handle are derived. **E-mail, postal address and owner name are not content** (they appear in the privacy notice): escalate |
| Service areas of one language | `areas-set <hu\|de\|en> "Zala megye" "Balaton" …` | At least one; say in one sentence what the list does (footer line and search data) |

## Not in the catalogue (escalate, with a `tech-lead` assessment)

Hero and About photos · seasonal announcement · opening hours · EUR prices · a new page or section · anything about the form, e-mail delivery, the privacy notice or consent · layout, colours, fonts, the logo.

## What every change brings along (you do nothing by hand)

- `npm run content:gates` runs lint, unit tests, the build (which refreshes `public/sitemap.xml` and `scripts/sitemap-lastmod.json`), the layout checks, the picture comparison and the e2e run on two browsers with the accessibility scan.
- The picture comparison differing is expected for content (`needsReview`): that is what the review page is for.
- The release script re-records the comparison pictures under the approver's name, writes the change log entry and commits exactly the files of the change.
