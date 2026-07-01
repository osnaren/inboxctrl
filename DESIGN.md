# Design System

## Color

**Strategy: Committed — deep navy carries the surface, electric blue identifies the brand.**

Dark command center palette in OKLCH:

```css
--bg: oklch(0.1 0.015 250); /* deep navy #0a0e1a — not pure black, carries the control-room atmosphere */
--surface: oklch(0.145 0.018 250); /* elevated panels — cards, sidebars, modals */
--surface-2: oklch(0.175 0.02 250); /* nested surfaces — tabs, inner cards */
--ink: oklch(0.92 0.008 250); /* primary body text — warm-tinted white, ≥7:1 on bg */
--ink-muted: oklch(0.62 0.015 250); /* secondary text — ≥3.5:1 on bg */
--primary: oklch(0.58 0.19 250); /* electric blue — actions, links, focus rings */
--primary-fg: oklch(
  0.98 0.002 250
); /* white text on primary fills (Helmholtz-Kohlrausch: saturated mid-L needs white) */
--accent: oklch(0.72 0.14 185); /* cyan — badges, status pills, secondary highlights */
--accent-fg: oklch(0.1 0.015 250); /* dark text on pale cyan fills */
--border: oklch(0.22 0.02 250); /* subtle dividers — visible but not prominent */
--glow: oklch(0.58 0.19 250 / 0.15); /* primary at 15% opacity — for glows, hover states */
--destructive: oklch(0.62 0.22 25); /* red — errors, destructive actions */
--warning: oklch(0.75 0.16 75); /* amber — warnings, caution states */
--success: oklch(0.68 0.17 155); /* green — success states, confirmations */
```

Light theme tokens (product app `apps/web` only):

```css
--bg: oklch(0.985 0.002 250); /* near-white with faint blue tint */
--surface: oklch(1 0 0); /* pure white cards */
--ink: oklch(0.145 0.015 250); /* near-black body text */
--ink-muted: oklch(0.5 0.015 250); /* muted secondary text */
--primary: oklch(0.48 0.19 250); /* darker blue for light-bg contrast */
--accent: oklch(0.55 0.14 185); /* deeper cyan for light theme */
--border: oklch(0.88 0.01 250); /* light divider */
```

### Contrast verification

| Pair                   | Ratio   | Pass?    |
| ---------------------- | ------- | -------- |
| ink on bg (dark)       | ~11.2:1 | ≥7:1 ✓   |
| ink-muted on bg (dark) | ~4.1:1  | ≥3.5:1 ✓ |
| primary-fg on primary  | ~4.8:1  | ≥4.5:1 ✓ |
| accent-fg on accent    | ~5.1:1  | ≥4.5:1 ✓ |
| ink on bg (light)      | ~12.8:1 | ≥7:1 ✓   |

## Typography

**Direction: Single-family precision.** One well-tuned geometric sans in multiple weights. No display/body pairing — the product voice is confident and technical, not editorial.

- **Primary:** Geist Sans (already installed in `apps/web`). Use for both site and product app.
- **Mono:** Geist Mono (already installed). For code blocks, terminal snippets, technical labels.
- **Scale:** Fixed rem scale, 1.2 ratio between steps. No fluid `clamp()` on the product app; site hero can use clamp for display impact.
- **Body line length:** 65–75ch max.

### Type scale

| Role                     | Size                   | Weight | Line-height | Letter-spacing |
| ------------------------ | ---------------------- | ------ | ----------- | -------------- |
| Display (site hero only) | clamp(48px, 6vw, 80px) | 700    | 1.0         | -0.02em        |
| H1                       | 2rem (32px)            | 700    | 1.2         | -0.015em       |
| H2                       | 1.5rem (24px)          | 600    | 1.3         | -0.01em        |
| H3                       | 1.25rem (20px)         | 600    | 1.4         | 0              |
| Body                     | 0.9375rem (15px)       | 400    | 1.6         | 0              |
| Small / Label            | 0.8125rem (13px)       | 500    | 1.4         | 0.01em         |
| Mono                     | 0.8125rem (13px)       | 400    | 1.5         | 0              |

**Letter-spacing floor:** -0.04em on display headings. Never tighter.

## Layout

- **Grid system:** CSS Grid for 2D layouts (dashboard panels, feature grids). Flexbox for 1D (navbars, toolbars, button groups).
- **Responsive grid:** `repeat(auto-fit, minmax(280px, 1fr))` for breakpoint-free card grids.
- **Spacing scale:** 4px base unit. Steps: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Z-index scale:** dropdown(100) → sticky(200) → backdrop(300) → modal(400) → toast(500) → tooltip(600). No arbitrary values.
- **Border radius:** 8px for cards, 6px for inputs/buttons, 4px for small elements, 9999px for pills. No 24px+ on cards.
- **Max content width:** 1200px for site, fluid for product app sidebar layout.

## Components

Built on `@base-ui/react` + `class-variance-authority` in `packages/ui`. 16 existing components.

### Variant vocabulary (site)

- **Glass panels:** `backdrop-filter: blur(12px)` + `background: oklch(0.145 0.018 250 / 0.6)` + thin border. Used sparingly — hero overlay, nav bar. Not on every card.
- **Glow accents:** `box-shadow: 0 0 24px var(--glow)` on primary buttons and focus states. Not on every surface.
- **Border treatment:** Single 1px `var(--border)` on cards. No paired border + shadow (the ghost-card anti-pattern).

### Component states

Every interactive element has: default, hover, focus-visible, active, disabled, loading. Skeleton states for loading, not spinners. Empty states that teach.

## Motion

**Energy: Restrained-cinematic.** The site earns one orchestrated page-load sequence. The product app is state-change-only.

- **Site hero:** Staggered reveal on load — headline (0ms), subtext (100ms), CTAs (200ms), WebGL scene fades in (300ms, 600ms duration). Ease-out-expo curve.
- **Site sections:** Fade-up on scroll intersection, 200ms, ease-out-quart. Only for content below the fold.
- **Product app:** 150–200ms transitions on all state changes. No page-load choreography.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` — instant transitions, no stagger, WebGL scene static or hidden.
- **No bounce, no elastic, no spring.** Exponential ease-out only.

## WebGL Direction (Site)

Atmospheric, not interactive. A subtle background layer showing abstract mail-routing paths — thin lines connecting nodes, with occasional pulses of light traveling along paths. Deep navy background, electric blue lines, cyan pulse accents.

- **Performance budget:** Must maintain 60fps on mid-range hardware. Degrade gracefully — static fallback image or CSS gradient on low-end devices.
- **Placement:** Hero section background only. Does not follow scroll, does not appear on other pages.
- **Library:** Three.js or raw WebGL — no heavy framework. Keep bundle impact < 50KB gzipped.
