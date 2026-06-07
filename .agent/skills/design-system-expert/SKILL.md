---
name: design-system-expert
description: Handles UI/UX design changes, ensures fluid typography, prevents text overflow, enforces the Steampunk design system, manages AI image/asset generation, and ensures professional craftsmanship in code and content.
---

# Design System Expert Skill

Enforces GaborPortfolio's CSS architecture and visual identity — fluid layouts, the Steampunk aesthetic, and AI asset generation standards. This is a showcase project; quality must impress.

*(Note: Color contrast ratios for accessibility → `accessibility-expert`. SEO `alt` and CLS attributes → `seo-expert`.)*

## When to use this skill
- Fixing mWeb (mobile) layout or horizontal scroll issues
- Modifying padding, margins, Flexbox, or Grid layouts
- Generating or replacing any image/video asset
- Enforcing the Steampunk component UI design

## How to use it

### 1. CSS Principles

| Principle | Rule |
|---|---|
| **Fluidity over fixes** | No fixed `px` for dimensions or typography. Use `clamp()`, `rem`, `vw`, logical properties. |
| **Text overflow** | `word-break: break-word`, `overflow-wrap: anywhere`, `hyphens: auto`. Never `white-space: nowrap` without an ellipsis strategy. |
| **Modern layout** | CSS Grid + Flexbox with `gap`. Always `flex-wrap: wrap` or `flex-direction` change for small screens. Every container: `max-width: 100%` + `box-sizing: border-box`. |
| **Safety Layer** | Group all layout-breaking fixes into a named "Safety Layer" in the CSS. |
| **CSS Variables** | All theme values (colors, spacing, font scales) use Custom Properties — no magic numbers. |
| **No Tailwind** | Vanilla CSS Modules or Inline Styles mapped to variables only. |
| **Icons** | Always SVG — aim for non-pixelated rendering. |
| **Zero-Selector 60fps** | Avoid React re-renders for animations. Use `useRef` for DOM elements and `rAF` (requestAnimationFrame) for updates. Update `style.setProperty` directly. |
| **Performance Loop** | Use `IntersectionObserver` to stop/start animation loops when components are off-screen to save CPU/battery. |
| **Cinematic HUD** | Use hardware-accelerated fixed backdrops (`body::before`) instead of `background-attachment: fixed`. Centralize background swaps via CSS variables. |
| **Glassmorphism** | Content panels should use `.glass-panel` or `.glass-panel-subtle` utility classes with `backdrop-filter: blur()`. |

### 2. Steampunk Design System

**Aesthetic**: "Fancy Steampunk Futuristic Elegant Dark Mode" — Polished Copper, Brushed Gold, Carbon Fiber, Mahogany, Glowing Vacuum Tubes.

| Token | Value |
|---|---|
| `--color-bg-dark` | `#121010` |
| `--color-copper` | `#b87333` — **Large text / decorative borders only** (contrast ~4.48:1) |
| `--color-gold` | `#d4af37` |
| `--color-text-main` | `#e0dacc` |
| `--glass-bg` | `rgba(18, 16, 16, 0.75)` (standard) |
| `--glass-blur` | `blur(12px)` (cinematic standard) |
| `--glass-border` | `1px solid rgba(184, 115, 51, 0.2)` |

**Typography**: Headings → `Courier New` (mechanical feel). Body → `system-ui`. Fluid scales with `clamp()`.

**Touch targets**: Internal `padding` inside interactive elements to satisfy the 48×48px rule *(handshake: `accessibility-expert`)*.

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
