# Visual baseline review — owner verdict, 2026-11-10

Owner: Gabor Sebők. Reviewed on the contact sheet (`node scripts/visual-contact-sheet.mjs` → `tests/visual/review.html`), verdict pasted into the chat verbatim below. Context: commit `8fdea0c` had already re-recorded `carousel-slide2-1280`, `notfound-1280` and `privacy-1280` on the owner's GO (see `visual-baselines-log.md`).

Reading of the verdict:

- 23 × OK: approved as the reference look.
- `contact-1280`, `privacy-1280`, `privacy-375` marked ISSUE and `contact-375` OK, all with the same note — the contact form and the privacy page were being updated in parallel sessions (form validation `f4feae3`, mailto fallback `189cc00`, GDPR `aefc023`). The owner then decided (chat, 2026-11-10): "we should be good to go with the first version for now". The suite was re-run from the build at `f4feae3`: 109/109 green, no pixel changed, so the first version stays the reference (log row of 2026-11-10). If a later change alters those pages, re-record through `npm run test:visual:update -- --approved-by="<name>"` after the owner has seen the new look at 375 and 1280.
- `header-1440`: no verdict on the sheet; covered by the owner's "good to go" and the reviewer's own check (wordmark on one line, nav spaced, quote button and language switch visible).

```
Visual baseline review 2026-11-10
OK    home-1280.png
OK    home-375.png
OK    services-1280.png
OK    services-375.png
OK    gallery-1280.png
OK    gallery-375.png
OK    rental-1280.png
OK    rental-375.png
OK    about-1280.png
OK    about-375.png
ISSUE contact-1280.png — this is getting at the moent updated
OK    contact-375.png — this is getting at the moent updated
ISSUE privacy-1280.png — this is getting at the moent updated
ISSUE privacy-375.png — this is getting at the moent updated
OK    notfound-1280.png
OK    notfound-375.png
OK    home-de-375.png
OK    home-en-375.png
OK    header-1120.png
OK    header-1280.png
      header-1440.png
OK    header-1920.png
OK    menu-open-375.png
OK    carousel-slide2-1280.png
OK    carousel-slide2-375.png
OK    toast-1280.png
OK    toast-375.png
```
