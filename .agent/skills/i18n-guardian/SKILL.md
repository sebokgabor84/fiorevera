---
name: i18n-guardian
description: Enforces translation key integrity across all locale files and all data sections. Use this skill when adding, renaming, or removing any i18n key, when adding a new locale language, or when adding a new page section with translatable content.
---

# i18n Guardian Skill

Ensures every data-driven translation key is present and consistent across **all locale files on disk** and **all data files that define keys**. This skill is self-discovering — it never assumes a fixed list of languages or sections.

*(Note: SEO hreflang architecture → `seo-expert`. Image asset validation → `design-system-expert`.)*

## When to use this skill
- Adding, removing, or renaming any `*Key` field in `src/data/`
- Adding a new locale language or a new page section with translatable strings
- Before any commit touching `src/data/` or `src/i18n/`

## How to use it

### 0. Discover — always start here
1. `ls src/i18n/locales/` — every `.json` found is a required target. Do not assume a fixed set.
2. `ls src/data/` — identify every file declaring any `*Key` field. Do not assume only known files.

### 1. Workflows

| Action | Rule |
|---|---|
| **Add key** | Add to all locale files in the same commit |
| **Add locale** | Populate all existing keys + register in i18n config + notify `seo-expert` (hreflang) |
| **Add page section** | Add all new keys to all existing locale files |
| **Remove key** | Delete from all locale files in the same commit — no deferral |
| **Rename key** | Update data file + all locale files atomically |

### 2. Verification checklist
- [ ] Every `*Key` in every data file has a matching entry in every locale file
- [ ] No locale file contains orphaned keys not referenced by any data file

## Translation Quality Guidelines
- **Idiom Translation Protocol (Native First)**: Never use literal word-for-word translation. Always find the native cultural equivalent (e.g., matching English 'Steady precision' to German 'In der Ruhe liegt die Kraft'). Optimize for the persona's tone (witty but professional engineer) rather than dictionary accuracy.
- **No plug & play**: Do not translate word-for-word. Restructure sentences to read naturally in the target language — German inverts clause order; Hungarian compounds nouns differently.
- **Cultural fit**: Adapt idioms. Witty phrases like "Bugs Squashed" must be re-crafted, not literally translated.
- **Jargon split**: Tech terms (`E2E`, `Zod`) stay in English universally. Craft/hobby terms use the authentic terminology a practitioner in that country would use.
- **Tone**: Confident, craft-focused, slightly technical — never corporate.
- **When in doubt**: Ask the user. Never guess a translation.

## Best Practices / Constraints
- Key naming: `kebab-case` dot-separated, e.g. `project.brewing.title`
- A key missing in even one locale is a **commit blocker**
## Sparring Manifesto (Push Back Rules)
- **Key Atomicity**: Veto any commit that introduces a key or locale without full population across all target files. No partial i18n allowed.
- **Natural Tone Veto**: Block literal word-for-word translations. Push back on phrases that ignore the target language's unique structure (e.g., German inverted verb order or Hungarian noun compounding).
- **Zero-Guessing**: Veto any translation that feels "guessed." If a term is unknown, the Agent MUST stop and ask the user for the practitioner's terminology.
- **Registration Gate**: Veto any new locale addition that has not been cross-verified with the `seo-expert` for `hreflang` and `<html lang>` synchronization.

## Implicit Loading (Handshakes)
This skill should almost always be loaded alongside:
- `design-system-expert`: Whenever content copy or hobby descriptions are added or refactored.
- `seo-expert`: When introducing new locales that require metadata/hreflang updates.
