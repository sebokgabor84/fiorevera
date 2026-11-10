# Occasional greetings by e-mail — consent concept (not a feature yet)

> **Status:** concept, 2026-11-10. Nothing in this document is live. The site stores no visitor data today.
> **This is not legal advice.** The author is a build assistant, not a lawyer. Every statement is tagged:
> **[INFO]** = legal information taken from the text of the law, **[CONFIRM]** = a lawyer or the Hungarian
> authority (NAIH) should confirm before go-live, **[DECISION]** = the owner decides. The Hungarian Chamber of
> Commerce and NAIH both publish free guidance for small businesses; a one-hour consultation with a data-protection
> lawyer who knows Grt. § 6 is the realistic budget for this feature.

Owner's intent (Gabor, 2026-11-10): keep the e-mail addresses entered on the site so Vera can write now and then —
a few greetings a year and a reminder on the couple's wedding anniversary — and phrase it on the whole site so visitors
understand this is not spam. Skill that owns this document: `.agent/skills/gdpr-guardian/SKILL.md`.
BACKLOG item: `[FEATURE]` newsletter / greetings list.

---

## 1. What the site processes today (inventory, verified in code on 2026-11-10)

| Flow | Data | Where it goes | Legal basis stated on `/adatkezeles/` | Source |
|---|---|---|---|---|
| Inquiry form | name, e-mail, phone (optional), wedding date, venue, message, locale | browser → `VITE_FORM_ENDPOINT` (Web3Forms or Formspree, **not chosen yet**, BACKLOG `[FORM]`) → `info.fiorevera@gmail.com` | consent (`privacy.sections.form`) | `src/lib/submitInquiry.ts`, `InquiryForm.tsx` |
| Honeypot `website` | nothing human | dropped client-side, never sent | — | `submitInquiry.ts` |
| Language preference | `fv-lang`, `fv-lang-toast-dismissed` | `localStorage`, never leaves the device | consent-exempt preference (`privacy.sections.storage`) | `src/lib/languagePreference.ts` |
| Browser language | `navigator.languages` read once in an effect | not stored, not sent | — | `LanguageToast.tsx` |
| Analytics | — | **Vercel Web Analytics is described on the privacy page and allowed in the CSP, but not wired in code** (no dependency, no script) | `privacy.sections.analytics` | `vercel.json`, `package.json` |
| Cookies | none | — | no banner (PRD D-10) | — |

The machine-readable version of this table is `docs/gdpr/data-register.json`; the audit script in the skill folder
fails when the code grows a sink the register does not list.

**Gaps found while reading, independent of the greetings list (both go to the owner, not fixed here):**

1. **[CONFIRM]** The privacy page says "the form service forwards the data" without naming it. GDPR Art. 13(1)(e)
   asks for the recipients or categories of recipients; naming the chosen processor (Web3Forms, India/US, or Formspree, US)
   and its transfer mechanism is the usual way to satisfy it. Do it when the `[FORM]` endpoint is created.
2. **[CONFIRM]** The inquiry data is kept in a **personal Gmail** mailbox. Google offers a data-processing addendum for
   Google Workspace, not for consumer Gmail. A lawyer should say whether that is acceptable for a sole trader at this
   volume or whether a Workspace account (or a Hungarian mailbox provider) is needed. This matters more once a list exists.
3. **[DECISION]** Either wire Vercel Web Analytics or remove the analytics section from the privacy page before launch;
   a privacy notice that describes processing which does not happen is not wrong, but it is not accurate either.

---

## 2. Lawful basis

### 2.1 GDPR (Regulation (EU) 2016/679)

- **[INFO] Art. 6(1)(a) consent** is the only realistic basis. Legitimate interest (Art. 6(1)(f)) is sometimes used for
  marketing to existing customers in the EU, but the Hungarian marketing rule below requires consent anyway, so there is
  no point arguing (f).
- **[INFO] Art. 4(11) + Art. 7 + Recital 32:** consent must be freely given, specific, informed and unambiguous, given by a
  clear affirmative act. Pre-ticked boxes, silence or inactivity do not count. The controller must be able to
  **demonstrate** consent (Art. 7(1)); the request must be **clearly distinguishable** from other matters (Art. 7(2));
  withdrawal must be **as easy as giving** consent (Art. 7(3)); the inquiry must not be made conditional on the marketing
  consent (Art. 7(4) — "no greetings box, no quote" is not allowed).
- **[INFO] Art. 5(1)(b) purpose limitation:** the wedding date is collected today to prepare a quote. Using it for an
  annual greeting is a **new purpose** and needs its own consent; it cannot ride on the inquiry consent.
- **[INFO] Art. 5(1)(c), (e):** data minimisation and storage limitation (section 4).
- **[INFO] Art. 12–13:** the privacy page must explain the purpose, basis, recipients, retention, rights, withdrawal and
  the complaint route (NAIH) in plain language, before or at the moment of collection.
- **[INFO] Art. 17 and Art. 21(2)–(3):** the right to object to direct marketing is absolute; after an objection the
  address must no longer be used for marketing. In practice: unsubscribe = delete from the list.
- **[INFO] Art. 28:** whoever stores or sends the mails for Vera is a **processor** and needs a written contract
  (Data Processing Agreement, DPA). Every serious newsletter provider includes one in its terms.
- **[CONFIRM] Art. 30:** the record-of-processing exemption for organisations under 250 employees does not apply when the
  processing is "not occasional". A standing mailing list is arguably not occasional, so a one-page Art. 30 record is
  cheap insurance.
- **[INFO] Art. 44–49:** data must stay in the EU/EEA or go to a country with an adequacy decision. US providers are
  covered by the EU-US Data Privacy Framework only if they are certified; an EU-hosted provider avoids the question.
- **[INFO] Art. 9:** names, e-mail, wedding date and locale are **not** special-category data.

### 2.2 Hungary

- **[INFO] Act XLVIII of 2008 on commercial advertising (Grt.) § 6(1):** advertising sent to a natural person by e-mail
  (or any direct electronic contact) is allowed **only with the recipient's prior, unambiguous and express consent**.
  Greetings from a business that carry the brand are advertising in the sense of this law; "it is just a greeting" is
  not a safe argument — treat every send-out as advertising.
- **[INFO] Grt. § 6(2):** the consent declaration may be given in any form from which the person and their consent can be
  identified; it must contain the person's name and the contact address used.
- **[INFO] Grt. § 6(3):** consent can be withdrawn at any time, free of charge, without giving a reason.
- **[INFO] Grt. § 6(5)–(6):** the advertiser must keep a **register** (nyilvántartás) of the persons who consented; the
  data in it may be used only for advertising with their consent and must be deleted on withdrawal. The provider's
  subscriber list with the consent record (section 3) is that register.
- **[INFO] Act CVIII of 2001 on electronic commerce (Ekertv.) § 14:** an electronic advertisement must be recognisable
  as such and must identify the sender and give a valid address for opting out.
- **[INFO] Act CXII of 2011 (Info tv.)** applies alongside the GDPR; the supervisory authority is **NAIH** for data
  protection and **NMHH** (media and infocommunications authority) for the spam rule in Grt. § 6.
- **[CONFIRM]** Hungary did not transpose the ePrivacy "soft opt-in" for existing customers (ePrivacy Art. 13(2)) into
  Grt. § 6 in a usable form. Conclusion to confirm: **even a couple who booked Vera needs a separate consent** before
  receiving a greeting mail.

### 2.3 ePrivacy and the DE/AT audience

- **[INFO] Directive 2002/58/EC Art. 13(1), (4):** unsolicited e-mail marketing needs prior consent; the sender must be
  identifiable and every mail must carry a valid address to object. Member states implement this in national law, and
  the law of the **recipient's** country is what a complaint will be judged under.
- **[CONFIRM] Germany, UWG § 7(2) No. 2:** e-mail advertising without prior express consent is an "unacceptable nuisance";
  German courts have for years treated **double opt-in** as the standard way to prove consent (BGH, 2011, "Double-opt-in").
- **[CONFIRM] Austria, TKG 2021 § 174:** prior consent for e-mail marketing to natural persons, with a narrow existing-customer
  exception; Austrian practice also expects double opt-in. Burgenland and Vienna are in the service area, so this is not
  theoretical.

---

## 3. What a valid consent looks like on this site

| Requirement | Design | Tag |
|---|---|---|
| Separate affirmative act | A **second, unticked checkbox** under the inquiry form, visually and semantically separate from the mandatory inquiry consent; the form submits fine without it; the field is never `required` | [INFO] Art. 7(2), (4); Rec. 32 |
| Plain-language purpose | The label says exactly what happens: *who* writes, *how often* (a few times a year), *what* (greetings, anniversary reminder), *what is stored* (e-mail, first names, wedding date), *how to stop* (one click) | [INFO] Art. 7(2), 13 |
| No bundling | The inquiry consent text stays as it is; the greetings box has its own text and its own error-free path | [INFO] Art. 7(4) |
| Double opt-in | After the form, the provider sends a confirmation mail in the visitor's locale; the address becomes active **only** after the link is clicked; unconfirmed addresses are deleted automatically after a short window (provider default, typically days) | [CONFIRM] proof standard DE/AT; best practice HU |
| Consent record | Per subscriber: e-mail, first names, wedding date, locale, **timestamp of the box**, **timestamp and IP of the confirmation click**, **version of the consent text** (`v1 2026-xx-xx`), source (`fiorevera.hu/kapcsolat`) | [INFO] Art. 7(1); Grt. § 6(2), (5) |
| Easy withdrawal | One-click unsubscribe link in every mail (provider-generated, no login), plus the e-mail address on the privacy page; a reply "stop" is honoured by hand within days | [INFO] Art. 7(3), 21; Grt. § 6(3); Ekertv. § 14 |
| Partial withdrawal | A second link or a reply option: **"keep the greetings, stop the anniversary reminder"** — couples divorce and partners die; an anniversary mail to the wrong inbox hurts the brand more than any spam complaint | [DECISION] recommended |
| Frequency promise | If the copy says "a few times a year", keep it: define a ceiling (e.g. at most 4 greetings + 1 anniversary mail per year) and write it down in the Art. 30 record | [DECISION] |
| Sender identity | Every mail: "Fiore Vera — Sebőkné Antalics Veronika, 8749 Zalakaros, Rózsa utca 53." and the reply address | [INFO] Ekertv. § 14; Grt. § 6 |
| No tracking by default | Switch off open- and click-tracking in the provider (or disclose it on the privacy page); the list is too small to need it | [DECISION] |
| Versioned texts | Changing the checkbox or privacy copy bumps the consent-text version; older subscribers keep their version in the record | [INFO] Art. 7(1) |

---

## 4. Data minimisation, retention, deletion

**Stored for the list, nothing else:** e-mail address · first name(s) of the couple (for the greeting) · wedding date
(for the anniversary) · locale (which language to write in) · the consent record from section 3.

**Explicitly not copied to the list:** phone, venue, message text, quote amounts, anything from later correspondence.

| Event | Action | Tag |
|---|---|---|
| Unsubscribe link clicked | Provider removes the address; export of the consent record kept **only** as proof of the former consent for the limitation period if the lawyer wants it, otherwise delete | [CONFIRM] retention of proof |
| Reply "stop" / e-mail request | Manual removal within a few working days, confirmation by reply | [INFO] Art. 12(3) |
| Hard bounce | Delete after the second bounce | housekeeping |
| Unconfirmed double opt-in | Auto-delete after the provider's window | [INFO] Art. 5(1)(e) |
| Long-term | Annual review; consider a **re-confirmation mail every 3 years** ("still want to hear from me?") and deletion of non-responders — a greetings list with no engagement data cannot otherwise show that consent is still current | [DECISION] |
| Access / correction / erasure request | Provider export or deletion, answered within one month | [INFO] Art. 15–17 |

---

## 5. Where the data could live

The site has no backend (PRD D-9/D-18) and that decision stands. Whatever stores the list is a **processor** and needs a DPA.

| Option | What it gives | Honest critique |
|---|---|---|
| **A. Newsletter provider, EU company, EU hosting** — Brevo (France) or MailerLite (Lithuania); both publish a DPA in their terms, offer double-opt-in forms, one-click unsubscribe headers, per-subscriber consent fields and a free tier that covers a wedding business for years. Verify the current data-location statement and the free-tier limits at sign-up; do not trust this document for them. | The consent record, the Grt. § 6(5) register, the unsubscribe mechanics and the Art. 21 handling come built-in. Multilingual confirmation mails are configurable. | Another account to maintain; the free tier shows the provider's badge in the footer; custom fields (wedding date, locale) must be created by hand; a provider is overkill for 30 addresses — but it is the only option where the proof of consent is not a home-made artefact. **Recommended.** |
| **B. Spreadsheet + sending from Gmail** (Google Sheets, mails with BCC) | Zero cost, zero new tools. | No unsubscribe link, no `List-Unsubscribe` header, no double opt-in, consent record is whatever Vera types; one BCC mistake exposes every couple's address to every other couple (a reportable breach, Art. 33); personal Google account has no DPA (section 1, gap 2); Gmail throttles bulk sends. Legal if done perfectly, fragile in practice. **Not recommended.** |
| **C. Serverless function on Vercel** that writes the consent record and calls the provider's API | Fully automatic, no manual step, API key stays server-side. | Breaks the "no backend" decision; adds a runtime to monitor, secrets to rotate and a second place where personal data passes through. Worth it only if the list grows past what a manual step can handle. |

**How the address gets from the form into option A — the real design question [DECISION]:**

1. **Manual (recommended first step):** the checkbox value travels inside the inquiry mail as `greetings_opt_in: yes` with
   the consent-text version and the submission timestamp (the provider mail carries the time). Vera adds the address to the
   newsletter provider with a flag that triggers the **double-opt-in confirmation**; the list entry only goes live on the
   click. Volume of a wedding business makes this a two-minute task per week. The inquiry mail is the first half of the
   consent record, the provider's confirmation log is the second half.
2. **Browser-side second POST** to the provider's public form endpoint (no API key in the client; the provider handles the
   confirmation mail). Needs the provider's host in `connect-src`/`form-action` of the CSP and a second request in
   `submitInquiry`; the address is then sent to two processors from the browser. Clean, but every provider's endpoint
   shape differs — decide after the provider is chosen.
3. Option C above.

---

## 6. What changes on the site when the feature goes live (checklist for the build slice)

| # | Change | Where | Guardians |
|---|---|---|---|
| 1 | New privacy section `privacy.sections.greetings` (title + body, HU/DE/EN) and add `'greetings'` to `SECTIONS` | `src/i18n/locales/*.json`, `src/pages/PrivacyPage.tsx` | gdpr-guardian, i18n-guardian |
| 2 | Bump `PRIVACY_UPDATED` in all three locales (hand-formatted, D-18) | `src/data/contact.ts` | i18n-guardian |
| 3 | Optional checkbox `greetings` under the inquiry consent: unticked, not required, own label with a link to the privacy section, helper line in Vera's voice; separate from the mandatory consent in DOM and styling | `InquiryForm.tsx`, `inquiry-form.module.css` | accessibility-expert (label, `aria-describedby`), design-system-expert |
| 4 | Payload: `greetings_opt_in`, `consent_text_version`; the honeypot and the existing fields unchanged; the mailto fallback carries the same flag | `src/lib/submitInquiry.ts`, `inquiryMailto.ts` | gdpr-guardian |
| 5 | One-line note under the form (and optionally in the footer contact column) | `contact.form.*` / `footer.*` keys | i18n-guardian |
| 6 | Confirmation mail (double opt-in) in three languages, configured in the provider, plus the standard footer (sender identity, unsubscribe, "stop only the anniversary reminder") | provider | gdpr-guardian |
| 7 | `docs/gdpr/data-register.json`: new form field, new host (if option 2), new processor; run the audit script | `docs/gdpr/` | gdpr-guardian |
| 8 | CSP: provider host in `connect-src` and `form-action` only if option 2 is chosen | `vercel.json` | seo-expert (head/CSP owner) |
| 9 | Tests: e2e asserts the box is unticked by default, the inquiry submits without it, the payload carries the flag when ticked; unit test for the payload shape; i18n parity | `tests/e2e/contact.spec.ts`, `tests/unit/submitInquiry.test.ts` | qa-specialist |
| 10 | Off-site: signed DPA with the provider, one-page Art. 30 record, consent text version `v1` dated, tracking switched off, lawyer's OK on sections 2–4 | owner | — |

---

## 7. Copy proposals (HU / DE / EN) — **not in the locale files until the owner says GO**

Voice: Vera speaks in the first person, informal (HU *te/ti* as on the HU privacy page, DE *ihr* — owner decision
2026-11-10: the site keeps *ihr* for the couple, no rewrite — EN *you*). The checkbox label itself is the visitor's
statement (that is what they tick); the helper line under it is Vera's voice.
Copy sign-off (R-1) is pending for the whole site; these are proposals in the same register as the surrounding strings.

### 7.1 Optional checkbox under the inquiry form (`contact.form.greetings`)

**HU**
> ☐ Kérem az évfordulós köszöntőt és évente néhány üdvözletet e-mailben. Ehhez az e-mail címemet, a keresztnevünket és az esküvőnk dátumát megőrzöd a <0>tájékoztató</0> szerint.
>
> *Helper:* Nem spam, ígérem: évente legfeljebb néhány levél tőlem, és egy rövid köszöntő a házassági évfordulótokon. Bármikor egy kattintással leiratkozhatsz. Ha nem jelölöd be, az árajánlat ugyanúgy megy.

**DE**
> ☐ Ja, ich möchte den Hochzeitstags-Gruß und ein paar Grüße im Jahr per E-Mail. Dafür werden meine E-Mail-Adresse, unsere Vornamen und unser Hochzeitsdatum gemäß der <0>Datenschutzerklärung</0> gespeichert.
>
> *Helper:* Kein Spam, versprochen: höchstens ein paar Mails im Jahr von mir und ein kurzer Gruß zu eurem Hochzeitstag. Abmelden geht jederzeit mit einem Klick. Ohne Häkchen bekommt ihr das Angebot genauso.

**EN**
> ☐ Yes, I'd like the anniversary greeting and a few greetings a year by e-mail. For that you keep my e-mail address, our first names and our wedding date as described in the <0>privacy notice</0>.
>
> *Helper:* No spam, promise: at most a few e-mails a year from me, and a short greeting on your wedding anniversary. Unsubscribe any time with one click. Leave the box empty and you still get the quote.

### 7.2 New privacy-page section (`privacy.sections.greetings`)

**HU — cím:** Üdvözletek és évfordulós köszöntő (csak ha kéred)

> Ha az űrlapon bejelölöd, hogy szeretnél néha hallani rólam, az e-mail címedet, a keresztneveteket és az esküvőtök dátumát elmentem, hogy évente néhányszor írhassak: egy-egy üdvözlet az ünnepek táján, és egy rövid köszöntő a házassági évfordulótokon. Ennyi, semmi más – nem küldök napi ajánlatokat, és az adataidat nem adom tovább senkinek. A bejelölés nem kötelező, és nem feltétele az árajánlatnak. Mielőtt bármit küldenék, kapsz egy megerősítő e-mailt; a feliratkozás csak az abban lévő linkre kattintva válik élővé. A leveleket a [szolgáltató neve] rendszerén keresztül küldöm, amely az adatokat az Európai Unióban tárolja, és adatfeldolgozói szerződés alapján dolgozik nekem. Minden levél alján van leiratkozó link; ha csak az évfordulós köszöntőt nem kéred, azt is jelezheted ott vagy az info.fiorevera@gmail.com címen. Leiratkozás után törlöm az adataidat a listáról. Az adatkezelés jogalapja a hozzájárulásod (GDPR 6. cikk (1) bekezdés a) pont; Grt. 6. §), amelyet bármikor visszavonhatsz – ez a korábbi küldések jogszerűségét nem érinti.

**DE — Titel:** Grüße und Hochzeitstags-Gruß (nur wenn ihr es möchtet)

> Wenn ihr im Formular ankreuzt, dass ihr ab und zu von mir hören möchtet, speichere ich eure E-Mail-Adresse, eure Vornamen und euer Hochzeitsdatum, um euch ein paar Mal im Jahr zu schreiben: ein Gruß rund um die Feiertage und ein kurzer Gruß zu eurem Hochzeitstag. Das ist alles – keine täglichen Angebote, und ich gebe eure Daten an niemanden weiter. Das Häkchen ist freiwillig und keine Bedingung für das Angebot. Bevor ich euch etwas schicke, bekommt ihr eine Bestätigungs-E-Mail; die Anmeldung wird erst mit dem Klick auf den Link darin wirksam. Die Mails verschicke ich über [Anbieter], der die Daten in der Europäischen Union speichert und für mich auf Grundlage eines Auftragsverarbeitungsvertrags arbeitet. In jeder Mail gibt es einen Abmeldelink; wenn ihr nur den Hochzeitstags-Gruß nicht möchtet, könnt ihr das dort oder unter info.fiorevera@gmail.com sagen. Nach der Abmeldung lösche ich eure Daten aus der Liste. Rechtsgrundlage ist eure Einwilligung (Art. 6 Abs. 1 lit. a DSGVO; ungarisches Werbegesetz Grt. § 6), die ihr jederzeit widerrufen könnt – die Rechtmäßigkeit früherer Sendungen bleibt davon unberührt.

**EN — title:** Greetings and the anniversary note (only if you ask for it)

> If you tick the box on the form saying you'd like to hear from me now and then, I keep your e-mail address, your first names and your wedding date so I can write a few times a year: a greeting around the holidays and a short note on your wedding anniversary. That's all – no daily offers, and I never pass your details on to anyone. The box is optional and not a condition for the quote. Before I send anything you get a confirmation e-mail; the subscription only becomes active when you click the link in it. I send the mails through [provider], which stores the data in the European Union and works for me under a data-processing agreement. Every mail has an unsubscribe link; if you only want to stop the anniversary note, you can say so there or at info.fiorevera@gmail.com. After you unsubscribe I delete your details from the list. The legal basis is your consent (GDPR Art. 6(1)(a); Hungarian advertising act Grt. § 6), which you can withdraw at any time – this does not affect the lawfulness of earlier mails.

### 7.3 One-line note under the form or in the footer contact column (`contact.form.greetingsNote` / `footer.greetingsNote`)

| | Text |
|---|---|
| HU | Az e-mail címedet csak akkor őrzöm meg, ha ezt külön kéred – és akkor is csak évente néhány üdvözletre. |
| DE | Eure E-Mail-Adresse behalte ich nur, wenn ihr es ausdrücklich möchtet – und auch dann nur für ein paar Grüße im Jahr. |
| EN | I only keep your e-mail address if you ask me to – and even then only for a few greetings a year. |

### 7.4 Double-opt-in confirmation mail (configured in the provider, not in the repo)

| | Subject | Body |
|---|---|---|
| HU | Egy kattintás, és néha írok – Fiore Vera | Szia {{first_names}}! Köszönöm, hogy szeretnél néha hallani rólam. Hogy biztosan te kérted, kérlek, erősítsd meg egy kattintással: {{confirm_link}} · Amit kapsz: évente néhány üdvözlet és egy rövid köszöntő a házassági évfordulótokon ({{wedding_date}}). Ha nem te voltál, nem kell tenned semmit – ez a cím nem kerül a listámra. Vera · Fiore Vera, Sebőkné Antalics Veronika, 8749 Zalakaros, Rózsa utca 53. |
| DE | Ein Klick, und ich schreibe euch ab und zu – Fiore Vera | Hallo {{first_names}}! Danke, dass ihr ab und zu von mir hören möchtet. Damit ich sicher bin, dass ihr es wart, bestätigt es bitte mit einem Klick: {{confirm_link}} · Was ihr bekommt: ein paar Grüße im Jahr und einen kurzen Gruß zu eurem Hochzeitstag ({{wedding_date}}). Falls das nicht ihr wart, müsst ihr nichts tun – die Adresse kommt dann nicht auf meine Liste. Vera · Fiore Vera, Veronika Sebőkné Antalics, 8749 Zalakaros, Rózsa utca 53., Ungarn |
| EN | One click and I'll write now and then – Fiore Vera | Hi {{first_names}}! Thank you for wanting to hear from me now and then. To be sure it was you, please confirm with one click: {{confirm_link}} · What you'll get: a few greetings a year and a short note on your wedding anniversary ({{wedding_date}}). If this wasn't you, do nothing – the address will not be added to my list. Vera · Fiore Vera, Veronika Sebőkné Antalics, 8749 Zalakaros, Rózsa utca 53., Hungary |

Every later greeting mail ends with the same identity block plus two links: *Leiratkozás / Abmelden / Unsubscribe* and
*Csak az évfordulós köszöntőt ne / Nur den Hochzeitstags-Gruß abbestellen / Stop only the anniversary note*.

---

## 8. Honest critique

1. **The feature is 10 % code and 90 % process.** The checkbox is an afternoon; the DPA, the Art. 30 record, the
   confirmation mail in three languages, the yearly review and the discipline of actually sending only "a few" mails are
   the work. If Vera will not keep the frequency promise, do not make it.
2. **Anniversary reminders are the riskiest part**, not legally but emotionally. One mail to a divorced or widowed person
   undoes years of goodwill. The partial opt-out and a human check before each anniversary batch (is the couple still a
   couple as far as Vera knows?) are the mitigation; a provider automation that fires on the date without a human is not
   recommended.
3. **"Greeting" is still advertising under Grt. § 6.** The copy says "not spam" and should, but the legal treatment is the
   same as a newsletter. Do not let the friendly tone talk anyone into skipping the consent record.
4. **Manual transfer (section 5, option 1) means the consent record lives in two places** (inquiry mail + provider log).
   That is acceptable for a sole trader but should be written down in the Art. 30 record so an auditor can follow it.
5. **The existing inquiry flow has two open questions** (unnamed processor, personal Gmail) that a lawyer will raise in the
   same conversation. Bring them together; one consultation, not two.
