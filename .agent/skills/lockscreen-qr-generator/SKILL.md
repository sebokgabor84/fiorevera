---
name: lockscreen-qr-generator
description: Generates highly detailed, thematic mobile lock screen backgrounds designed to frame functional QR codes and logos without overlapping mobile UI elements. Use when generating custom lock screen wallpapers or backgrounds specifically intended for scannable QR codes.
---

# Lockscreen QR Generator

Generates a highly detailed, thematic mobile lock screen background designed to perfectly frame a functional, pre-generated QR code and a brand favicon/logo. The design accommodates mobile OS UI elements (clock, notifications, quick actions) by intentionally leaving designated areas uncluttered.

## When to use this skill
- When requested to generate a mobile wallpaper or lock screen.
- When generating backgrounds specifically intended to hold scannable QR codes.
- When creating branded marketing assets for mobile displays.

## How to use it
To guarantee 100% scannability and perfect branding, use this two-step professional workflow:

### Step 1: Background Generation
Do not attempt to generate the complicated QR code directly via AI if it needs to be scannable. Instead, use an AI image generator (e.g., Nano Banana Pro) to generate the *frame* and *background*.

Use a prompt structured like "The Master Prompt" below. Modify the "Center Stage" instruction to simply generate an empty framed white square and an empty circular/hexagonal badge holder below it.

### Step 2: Asset Injection (Compositing)
1. Drop the valid `[SOURCE_QR_IMAGE]` directly into the generated white square. Multiply the blending mode to remove any white edge artifacts.
2. Drop the `[SOURCE_FAVICON]` into the generated badge holder below the QR code. Apply a slight drop shadow and match the lighting/color overlay of the surrounding background.

## The Master Prompt Framework
Gather these variables before prompting the AI:
- `[THEME_DESCRIPTION]`: The core aesthetic (e.g., "dark industrial steampunk workshop mixed with a modern QA coding terminal").
- `[COLOR_PALETTE]`: Key colors (e.g., "dark wood, matte black steel, burnished copper, glowing terminal-green, warm amber light").
- `[FRAME_MATERIAL]`: The material for the square frame enclosing the QR code (e.g., "riveted copper").
- `[LOGO_DESCRIPTION]`: The emblem/logo style (e.g., "geometric hexagonal gear monogram GS").

**Base Prompt Template:**
> A pristine, high-end iPhone lock screen wallpaper, perfectly vertically oriented (9:16 aspect ratio). The aesthetic is a sophisticated blend of `[THEME_DESCRIPTION]`. Color palette features `[COLOR_PALETTE]`.
> 
> **Layout Constraints (CRITICAL):**
> *Top 30%*: Keep completely clear of complex details, utilizing only smooth, dark background textures so a digital clock can be easily read.
> *Bottom 20%*: Keep completely clear of complex details, utilizing only a simple floor or dark panel texture. Do NOT generate any UI icons, flashlights, camera buttons, or swipe bars.
> *Center Stage*: A perfectly square, minimalist, elegant `[FRAME_MATERIAL]` frame. Inside this frame is a pure, stark white square canvas holding a sharp, high-contrast black-and-white QR code.
> *Directly Below the Frame*: Seamlessly integrated into the machinery/background is a beautifully rendered, 3D emblem of a `[LOGO_DESCRIPTION]`.
> 
> **Lighting & Quality**: Cinematic lighting, volumetric shadows, highly detailed 8k resolution, Unreal Engine 5 render style. Ensure the pure white square for the QR code has zero shadows, zero dirt, and zero lighting artifacts to ensure perfect scannability.
> 
> **Negative Prompt (Crucial for clean results):**
> text, watermarks, UI elements, fake clock, flashlight icon, camera icon, home bar, battery icon, status bar, dirty white space, distorted QR grid, messy background, low contrast, blurry.

## Best Practices & Constraints
- **Scannability First**: AI image generators cannot reliably generate 100% functional, highly dense QR codes from scratch if stylized. The QR code must be composited afterward.
- **UI Avoidance**: System elements (iOS clock, flashlight, camera, home indicator) must be explicitly excluded via negative prompts to prevent baking fake UI elements.
- **Thematic Blending**: Blend steampunk elements with modern, sleek aesthetics (e.g., QA coding terminals) to avoid looking "old school".
