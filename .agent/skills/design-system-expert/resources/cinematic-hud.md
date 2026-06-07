---
name: cinematic-hud-architecture
description: Architecture for hardware-accelerated fixed backdrops and glassmorphism HUD layers.
---

# Cinematic HUD Architecture

Core rules for implementing the "Glass HUD" system where a fixed cockpit background remains stationary while translucent content panels scroll over it.

## When to use this resource
- Switching from per-page backgrounds to a unified cockpit backdrop.
- Implementing high-performance 60fps scrolling with `backdrop-filter`.
- Debugging mobile jitter or scroll lag related to background images.

## Core Architectural Rules

| Component | Rule | Implementation |
|---|---|---|
| **Backdrop Layer** | Fixed Position | Use `body::before` or a fixed `div` with `z-index: -1`. |
| **Performance** | Offload to GPU | Use `transform: translateZ(0)` and `will-change: transform`. |
| **Glass Panels** | Glassmorphism | Apply `backdrop-filter: var(--glass-blur)` and `background: var(--glass-bg)`. |
| **Breathing Room** | Cockpit View | Panels use `width: auto` and `margin: 4vw` on mobile to show the cockpit edges. |
| **Header Spacing** | Tighter Alignment | Hero top padding base: `clamp(0.5rem, 2vh, 1rem)` to eliminate large gaps. |

## Implementation Plan (Verified)

1. **Global Constants**: Define `--glass-bg`, `--glass-blur`, and `--cockpit-bg-image` in `index.css`.
2. **Fixed Background**: Remove `background-image` from `body`. Implement `.cinematic-cockpit-bg` with `position: fixed`.
3. **Layer Separation**:
    - **Layer 1 (Fixed)**: GPU-accelerated backdrop with `radial-gradient` vignette.
    - **Layer 2 (Scrolling)**: Content layer with `position: relative` and `z-index: 1`.
4. **Dynamic Backgrounds**: Use a `useEffect` on page mount to update `--cockpit-bg-image` based on the current route (e.g., `hero-cockpit.webp` vs `bg-mission-control.webp`).
5. **HUD Safety**: Ensure navigation elements (like `BackButton`) are outside filtered containers to maintain `position: fixed` stickiness.

## Best Practices
- **No `background-attachment: fixed`**: Triggers repaints; use the Layered 1 fixed-position strategy.
- **Vignette Strategy**: Center background details should be darker/minimal to ensure text legibility.
- **Scroll Dimming**: Optionally use `App.tsx` scroll listener to update a `--scroll-brightness` variable.