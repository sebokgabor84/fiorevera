---
name: design-system-expert
description: >-
  Handles UI/UX design changes, ensures fluid typography, prevents text overflow,
  enforces Fiore Vera's romantic rustic-elegant design system (linen background,
  soft sage, muted blush, warm gold, Cormorant Garamond, Inter), manages AI image/asset
  generation, and ensures professional craftsmanship in code and content.
---

# Design System Expert Skill — Fiore Vera Domain

Enforces Fiore Vera's visual identity — fluid layouts, romantic rustic-elegant aesthetic, organic floral styling, and high-fidelity image asset standards.

*(Note: Color contrast ratios for accessibility → `accessibility-expert`. SEO `alt` and CLS attributes → `seo-expert`.)*

## When to use this skill
- Fixing mobile layout or horizontal scroll issues
- Modifying padding, margins, Flexbox, or CSS Grid layouts
- Generating or replacing any floral/decoration image or lockscreen asset
- Enforcing the Fiore Vera brand UI design (colors, typography, components)

## How to use it

### 1. CSS Principles

| Principle | Rule |
|---|---|
| **Fluidity over fixes** | No fixed `px` for dimensions or typography. Use `clamp()`, `rem`, `vw`, logical properties. |
| **Text overflow** | `word-break: break-word`, `overflow-wrap: anywhere`, `hyphens: auto`. Never `white-space: nowrap` without an ellipsis strategy. |
| **Modern layout** | CSS Grid + Flexbox with `gap`. Always `flex-wrap: wrap` or `flex-direction` change for small screens. Every container: `max-width: 100%` + `box-sizing: border-box`. |
| **Safety Layer** | Group all layout-breaking fixes into a named "Safety Layer" in the CSS. |
| **CSS Variables** | All theme values (colors, spacing, font scales) use Custom Properties — no magic numbers. |
| **Vanilla CSS** | Vanilla CSS Modules or Inline Styles mapped to variables. |
| **Icons** | Always SVG — high precision, non-pixelated. |
| **Glassmorphism** | Warm glass effect using `.glass-panel` (`rgba(255, 253, 250, 0.85)` + `backdrop-filter: blur(12px)` + soft border). |

### 2. Fiore Vera Design System

**Aesthetic**: "Romantic, Rustic-Elegant, Warm & Organic" — Warm Linen, Soft Sage Leaves, Muted Blush Peonies, Warm Antique Gold, Subtle Grain Textures.

| Token | CSS Variable | Value | Purpose |
|---|---|---|---|
| **Background Linen** | `--color-bg-linen` | `#faf7f2` | Primary page background (warm off-white/linen) |
| **Card / Surface** | `--color-surface` | `#ffffff` | Elevated card & section surface |
| **Primary Text** | `--color-text-main` | `#2c2825` | Deep charcoal/espresso for body text |
| **Muted Text** | `--color-text-muted` | `#6b635b` | Secondary labels & captions |
| **Soft Sage Accent** | `--color-sage` | `#7a8b7b` | Primary botanical accent / subtle highlights |
| **Muted Blush** | `--color-blush` | `#e8c5c8` | Soft romantic floral accent |
| **Warm Gold** | `--color-gold` | `#d4af37` | Premium decorative accent & borders |
| **Glass Backdrop** | `--glass-bg` | `rgba(250, 247, 242, 0.85)` | Airy header & glass panels |
| **Glass Border** | `--glass-border` | `1px solid rgba(212, 175, 55, 0.25)` | Gold-tinted border |

**Typography**:
- **Headings & Titles**: `Cormorant Garamond`, `Playfair Display`, or fallback `serif` (elegant, high-contrast serif).
- **Body & Controls**: `Inter`, `Lato`, or fallback `sans-serif` (clean, highly legible).
- **Fluid Scales**: All headings scaled dynamically with `clamp()`.

**Touch targets**: Minimum 48×48px interactive target area *(handshake: `accessibility-expert`)*.

### 3. Asset Generation Rules

| Rule | Standard |
|---|---|
| Format | `webp` only |
| Max size | 200 KB |
| Resolution | 8K (retina-optimised) |
| Storage | `public/assets/` |
| Pattern | Facade Pattern — static image first, interactive media second |
| Tool | Nano Banana Pro (or equivalent when token budget is exhausted) |

**Asset Library** — use these anchored prompts to maintain visual consistency:

| File | Concept |
|---|---|
| `hero-cockpit.webp` | Panoramic copper gauges + digital displays, Mission Control feel |
| `thumb-qa.webp` | Futuristic terminal, glowing code streams, steampunk bug scanner |
| `thumb-brewing.webp` | Copper brewing vats, magnetic pumps, bubbling liquid, lab setting |
| `thumb-wedding.webp` | Hexagonal iron gate, welding sparks, elegant metalwork, rustic workshop |
| `thumb-house.webp` | Holographic blueprint overlaying rustic wood, fusion of old and new |

## Sparring Manifesto (Push Back Rules)
- **Veto on Fluff**: Challenge and remove any "pretentious" terminology (e.g., "Master Artisan"). Stick to professional, grounded artisan terms (e.g., "Technician," "Builder").
- **Visual Consistency**: Veto any UI change that breaks the Steampunk aesthetic (Copper/Gold/Dark/Glass) without a documented technical reason.
- **Mobile First**: Automatically block any layout proposal that doesn't account for fluid typography and touch targets.
- **Performance First**: Veto unoptimized assets (WebP > 200KB) and main-thread blocking animations.

## Content Voice & Storytelling
When writing content, descriptions, or project copy, adopt a **Professional Craftsman** voice: precise, detailed, and results-oriented. Family milestones are treated as KPIs; tone is witty but grounded.

### Artisan Terminology
Use authentic practitioner language rather than generic descriptions:

| Hobby | Terminology to use |
|---|---|
| **Brewing** | Mag-Drive Pumps, Semi-Automated, Fermentation cycles, Liters brewed |
| **Welding** | Old-fashioned Electrode Welding, Structural design, Custom Hexagonal Gates |
| **Beekeeping** | Apiary management, Honey extraction, Sustainable practices |
| **Bread Making** | Natural sourdough starters, Long fermentation, Perfect crust |

**Micro-animations**: UI transitions should feel mechanical — subtle, handcrafted, premium.
**Mission Control terminology**: Use "Cockpit" (status area), "Dashboard" (overall view), and "Scene" (3D carousel area) when discussing the HomePage layout.

## Resources
- **Cinematic HUD Architecture**: `resources/cinematic-hud.md` — Core rules for fixed backdrops and HUD content layers.
- **Mission Control 3D Architecture**: `resources/mission-control-prompt.md` — Strict rules for building 3D JS Hybrid carousels without WAAPI or CSS-only limitations (IntersectionObserver, rAF).
- **Asset Generation (Nano Banana Pro)**: `resources/mission-control-asset-generator.md` — The master prompts for maintaining Steampunk material consistency across all new graphical assets.
- **Hexagon "S" Logo Generator**: `resources/svg-favicon-generator.md` — Strict SVG geometry and theme adaptation rules for the project insignia.
