# Layout safety checklist

Run before and after any change to `src/styles/global.css` (Safety Layer, `.container`, utilities), `header.module.css`, any `position: fixed/sticky` element, or a grid breakpoint. The unit and e2e suites do **not** assert widths, line length or stacking (QA 2026-11-09 Honest Critique) — this is a manual gate (README step 9 / `AGENTS.md` POST-4).

Dev look: `npm run dev` (CSR, :5173). Production look: `npm run build && npm run preview` (prerendered, :4173) — check the prerendered build for header/hero issues, it is what Vercel serves.

## Widths

| Width | Why this width | Check |
|---|---|---|
| 375 | iPhone baseline. Wordmark is hidden `≤ 24rem` (384 px) so only the logo mark shows; menu toggle visible. | No horizontal scroll; hero text readable over the photo; eyebrow pill does not hyphenate; carousel arrows 48 px and not under the scroll-to-top button; toast at the bottom, dismiss 48 px. |
| 768 | `48rem` breakpoint: cards 3-up, teaser 4-up, quotes 2-up, about `2fr 3fr`; reasons stay **1 column** until `64rem` (QA M12). | No column narrower than ~240 px; the hyphenation query is `max-width: 48rem` (768 px inclusive), so body text may hyphenate at 768 and must be `hyphens: manual` at 769; headings never hyphenate. |
| 1280 | Desktop nav `≥ 70rem` (1120 px); quote button appears `≥ 80rem` (1280 px). | Header bar (`max-width: 90rem`) fits logo + 6 links + switch + button on one line, wordmark not wrapped; `.container` 1152 px. |
| 1920 | Widest common desktop. | `.container` still 1152 px, lead ≈ 1072 px, ≤ ~90 characters per line; carousel 3:2 box shorter than the viewport; header bar capped at 1440 px, not full-bleed. |

## States

| State | How to trigger | Must hold |
|---|---|---|
| Mobile menu open | 375 and 768, tap "Menü" | Panel from `--header-h` to the bottom, above page content; toast hidden (`body.menu-open`); scroll locked only `< 70rem`; Escape closes from any focus; focus returns to the toggle. |
| Toast visible | Browser language `de` or `en` on a HU page; clear `localStorage.fv-lang` | Bottom-anchored under the safe area, not over the H1 or hero text; `body.toast-visible` pads the page so the footer end is reachable; glass surface readable over any photo. |
| Scrolled header | Scroll 200 px | Gold hairline + deeper shadow; text ≥ 4.5:1 over every hero pixel (glass on `::before`); menu panel still not trapped inside the header. |
| Keyboard | Tab from the address bar | Skip link first; 3 px gold ring on every stop including the carousel track (inset ring, QA M11); nothing with `overflow: hidden` clips a ring. |
| Hero | 375 and 1920 | Text sits in the shaded region; `object-position: center 40%` keeps the arrangement in view. |
| Gallery | Any width | Box stays 3:2 across slides; arrows visible without hover; portrait shots centre-cropped acceptably. |
| Reduced motion | OS setting or DevTools emulation | No transitions/animations. |

## Measurements to record (DevTools console)

```js
document.querySelector('.container').getBoundingClientRect().width; // 1152 at ≥ 1280
getComputedStyle(document.querySelector('main p')).hyphens;        // 'manual' above 48rem, 'auto' at/below
[...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1); // []
document.body.classList.contains('toast-visible');                  // true when the toast is up
```

## Browsers
chromium, webkit, firefox (the Playwright projects). `backdrop-filter`, `aspect-ratio` and `scroll-snap` rendered identically in the 2026-11-09 QA run; re-check **webkit** after any header or glass change, and **Mobile Chrome** after any touch-target change.

## Record
Add the viewport × state screenshots (or the measured numbers) to the Review Brief. A slice without them is not "done".
