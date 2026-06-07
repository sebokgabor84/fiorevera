---
name: mission-control-3d-architecture
description: High-performance 3D Carousel architecture using rAF and IntersectionObserver.
---

# Mission Control 3D Architecture

Rules for the cinematic 3D rotating hardware carousel. Bypasses React's render cycle for 60fps mechanical fluidity.

## When to use this resource
- Refactoring the mission control status list into a 3D drum.
- Implementing performance-critical 3D animations without WAAPI limitations.

## Core Engine: Optimized JS Hybrid

| Principle | Rule | Implementation |
|---|---|---|
| **Performance** | Zero-Selection 60fps | Use `requestAnimationFrame` + `useRef` (not `useState`). |
| **3D Math** | Drum Geometry | Rotation: `index * (360/total)`. Depth: `translateZ(radius)`. |
| **Fluidity** | Dynamic Sizing | Use `clamp()` for `--drum-radius` to prevent mobile clipping. |
| **Control** | Auto-Spin | Continuous `-0.15deg/frame` unless hovered/dragged. |

## Web Vitals Protection Protocol

| Guard | Rule | Implementation |
|---|---|---|
| **INP (Idle)** | IntersectionObserver | Stop rAF loop when component is off-screen. |
| **INP (Input)** | Passive Listeners | Use `{ passive: true }` for pointer events. |
| **CLS (Visual)** | Skeleton UI | Render carbon-fiber pulse skeleton during 8K asset load. |
| **LCP (Loading)**| Lazy Matrix | `loading="eager"` for front 2 tiles; `lazy` for the rest. |

## Material standards
- **Drum Bezels**: Overlay tiles with pure SVG `<rect>` for sharp edges without PNG overhead.
- **Dynamic Contrast**: Inject a gradient fading to `#121010` at the bottom of each tile for text legibility.
- **Mechanical Feel**: Apply `touch-action: pan-y` to allow vertical scrolling while intercepting radial spins.

## Hardware Hardening
- **Safari Support**: Enforce `-webkit-transform-style: preserve-3d` on all container layers.
- **Parallax**: Dashboard background should use `background-attachment: fixed` (unless causing jank; see `cinematic-hud.md`).