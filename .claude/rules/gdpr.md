---
paths:
  - "docs/gdpr/**"
  - "src/lib/**"
  - "index.html"
  - "vercel.json"
  - ".env.example"
---

# Personal-data register

- `docs/gdpr/data-register.json` is checked by `npm run audit:gdpr` (also part of the unit run). Every form field, storage key, `VITE_*` endpoint, network-sending file, external host and `navigator.*` signal in `src/`, `index.html` and the CSP must be declared with a purpose and the `privacy.*` key that explains it; the audit fails on an undeclared sink. After an intended register change: `npm run audit:gdpr -- --seal`.
- The consent-based greetings list (opt-in e-mail, a few mails a year plus the anniversary) is a concept only: `docs/gdpr/newsletter-consent-concept.md` holds the legal basis, the design and the HU/DE/EN copy proposals, which stay out of the locale files until the owner's GO.
- Rules: `.agent/skills/gdpr-guardian/SKILL.md`.
