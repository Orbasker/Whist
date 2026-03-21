# Whist v2 — Design System & Screen Specification

> Source of truth: [Stitch Project #449553823976541812](https://stitch.withgoogle.com/projects/449553823976541812)
> Creative North Star: **"The Neon Conservatory"**

---

## 1. Design Philosophy

A sophisticated, late-night card room where deep shadows meet the electric pulse of competition. We reject rigid boxed grids in favor of **Tonal Fluidity**:

- **Intentional Asymmetry** — Overlapping card elements, offset typography scales
- **Atmospheric Depth** — Layers of smoked glass and light, not flat pixels
- **High-Contrast Energy** — Extreme shifts between "Midnight" foundations and "Electric" accents

---

## 2. Color Palette (Stitch Tokens)

### Core

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#081425` | Deepest canvas for all play |
| `primary` | `#8AD0FF` | Text/icon on dark surfaces |
| `primary-container` | `#14B8FF` | Electric Teal — primary actions, active states |
| `secondary` | `#4AE176` | Neon Green — wins, successful bids, "Go" actions |
| `secondary-container` | `#00B954` | Darker green for containers |
| `tertiary` | `#F1C400` | Bright Gold — prestige, trophies, leaderboard leaders |
| `tertiary-container` | `#D0A900` | Darker gold for containers |
| `error` | `#FFB4AB` | Error text |
| `error-container` | `#93000A` | Error background |

### Surfaces (Tonal Hierarchy — darkest to brightest)

| Token | Hex |
|-------|-----|
| `surface-container-lowest` | `#040E1F` |
| `surface-dim` / `surface` | `#081425` |
| `surface-container-low` | `#111C2D` |
| `surface-container` | `#152031` |
| `surface-container-high` | `#1F2A3C` |
| `surface-container-highest` / `surface-variant` | `#2A3548` |
| `surface-bright` | `#2F3A4C` |

### On-Surface Text

| Token | Hex | Usage |
|-------|-----|-------|
| `on-surface` | `#D8E3FB` | Primary body text |
| `on-surface-variant` | `#BDC8D2` | Secondary/muted text |
| `outline` | `#87929B` | Subtle separators |
| `outline-variant` | `#3E4850` | Ghost borders (15% opacity) |

### Inverse (Light Mode / Badges)

| Token | Hex |
|-------|-----|
| `inverse-surface` | `#D8E3FB` |
| `inverse-on-surface` | `#263143` |
| `inverse-primary` | `#00658F` |

### The "No-Line" Rule

**Never use 1px solid borders to define sections.** Structure is conveyed through background shifts between surface tokens. A card (`surface-container-low`) sits on a section (`surface-container-lowest`), which sits on the global `background`. The eye perceives edges through tonal depth, not strokes.

**Ghost Border Fallback:** If accessibility requires a container edge, use `outline-variant` at **15% opacity** — a "glint" on glass, not a heavy border.

---

## 3. Typography

**Font Family:** Plus Jakarta Sans (all weights)

| Role | Weight | Size | Usage |
|------|--------|------|-------|
| Display Lg/Md/Sm | Bold | 48–96px | Game over, winning scores, hero text |
| Headline | Bold | 28–36px | Screen headers, card titles |
| Title | Semi-bold | 20–24px | Section titles |
| Body Lg/Md/Sm | Regular | 14–18px | Instructional text, data |
| Label Lg/Md/Sm | Medium | 11–14px | Metadata ("Round 3", "Dealer") |

**Key rules:**
- Tight letter-spacing (`-0.02em`) on headlines/titles for premium feel
- Pair Display scores with Label player names for broadcast-style hierarchy
- Never use 100% opaque black or white — always use themed tokens

---

## 4. Elevation & Depth

### Tonal Layering (primary elevation method)

```
Base:    surface              (#081425)
Section: surface-container-low (#111C2D)
Card:    surface-container-high (#1F2A3C)
```

### Shadows

- **Ambient (floating elements):** `0px 24px 48px rgba(0, 0, 0, 0.4)` — wide and soft
- **No standard drop shadows** — only ambient specification
- **Glassmorphism (modals/overlays):** `surface-variant` at 60% opacity + `backdrop-blur(16px)`
- **Glass headers:** `backdrop-blur(12px–20px)` with semi-transparent surface

---

## 5. Component Specifications

### Buttons

| Type | Style |
|------|-------|
| **Primary** | `primary-container` bg with gradient to `primary`, roundedness `xl` (1.5rem) |
| **Secondary** | No bg, ghost border + `primary` text |
| **Tertiary** | Text-only with `primary` color |
| **CTA (Gold)** | Linear gradient from `tertiary` to `tertiary-container` at 135deg |

Main CTAs: subtle gradient from primary to primary-container at 135deg for backlit feel.

### Cards ("Play Space")

- No borders (surface hierarchy only)
- `surface-container-low` background
- Internal padding: `spacing-4` (1rem)
- Hover/tap: shift to `surface-container-highest`

### Chips (Suits & Bids)

- Full roundedness (pill shape)
- Selected: soft outer glow of own color
- Typography: `label-md` Bold

### Scoreboard Lists

- **No divider lines** — use `spacing-2` vertical whitespace between rows
- Current player row: `surface-bright` background

### Trump Indicator

- Floating glass circle, `tertiary` (Gold) color
- Corner of screen positioning

---

## 6. Screen Inventory (Stitch)

### Desktop Screens (1280px)

| Screen | Stitch ID | Route | Status |
|--------|-----------|-------|--------|
| Landing Page | `3b50887270ed4536a822c99633132501` | `/` | Needs update |
| Landing Animated v2 | `a4198f4bd541483ebeaa6c5b8b89e408` | `/` | Reference |
| Auth Screen v2 | `5f9ff5f6210849c9b435420b4a60dc63` | `/login` | Needs update |
| Splash Screen v2 | `5d0215dfc3f441c5b6de2e72a59482ce` | — | Future |
| Home Dashboard | `97ccd7c9514d48a8b618317209eccdea` | `/dashboard` | Needs update |
| My Games Dashboard | `51fbecb6e9704538871cffa511e56c6e` | `/dashboard` | Reference |
| New Game Setup | `a487f0860a7c4b169fe5326912a1042b` | `/dashboard` (modal) | Needs update |
| Bidding Phase | `582be71627ae4004b7304100a3bd5232` | `/game` (bidding) | Needs update |
| Bidding Phase v2 | `1ddfbb5c98474e61b979dd9fa5d25081` | `/game` (bidding) | Reference |
| Tricks Phase | `c5a426be74f34d24a9d0937c97c5c1f0` | `/game` (tricks) | Needs update |
| Tricks Phase v2 | `7365f12f8aa64e8fb511e2a6fdc9831a` | `/game` (tricks) | Reference |
| Score Table | `fdbdad6e954b4263b4488aead78b22de` | `/game` (modal) | Needs update |
| Round History | `9375dd9a914e47758e4eeeb4d01d7bcc` | `/game` (modal) | Needs update |
| Round History v2 | `64c456be37b146ebb27079edbdffa6ba` | `/game` (modal) | Reference |
| Round Summary | `acc882a4018545afae6840d97d022962` | `/game` (modal) | Needs update |
| Invitation Modal | `8b86de605f6242879315cce069d17664` | `/dashboard` (modal) | Needs update |

### Mobile Screens (390px)

| Screen | Stitch ID | Status |
|--------|-----------|--------|
| Splash v2 | `905255395ccd42aab429437a79c89cc7` | Future |
| Auth v2 | `ad4b72b4d1a34ef981e96a9c23cffd49` | Needs update |
| My Games Dashboard | `cefbbc65d7b04bc9b4964e9f2580c397` | Needs update |
| New Game Setup | `c346a2e398664270a8c92d961cca65c3` | Needs update |
| Bidding Phase | `b2dbcb8a70d1483db668bd8cab096937` | Needs update |
| Tricks Phase | `ee9c216652af42d080ba2eb670763482` | Needs update |
| Round Summary | `32cb16faa7ab4f38aafb6437186261dd` | Needs update |
| Round History v2 | `be90af20ea3d45918360335f9a5ca3df` | Needs update |
| Round History v2 (alt) | `6727d27516a4484baf2382135e8659f9` | Reference |
| Round History v3 | `cdf1757a37e3459285852a5d594f91f9` | Reference |
| Invitation Form | `9edc2d3ac2324e5888ace3320bb75367` | Needs update |

---

## 7. Gap Analysis: Current Angular vs Stitch Design

### Color Palette Mismatch (Critical)

| What | Current Angular | Stitch Target |
|------|----------------|---------------|
| Background | `#0B1326` | `#081425` |
| Primary | `#95D3BA` (emerald) | `#8AD0FF` / `#14B8FF` (electric teal) |
| Secondary | `#FFB95F` (gold) | `#4AE176` (neon green) |
| Tertiary | `#BDC8D3` | `#F1C400` (bright gold) |
| CTA buttons | Gold gradient `#FBB441→#EDA026` | Tertiary gold `#F1C400→#D0A900` or Primary teal gradient |
| Error container | `#93000A` | `#93000A` (same) |

**Impact:** The entire color system needs remapping. Current "gold" secondary should become the tertiary prestige color. Current "emerald" primary should become electric teal. Green is reserved exclusively for wins/success.

### Typography Mismatch

| What | Current | Target |
|------|---------|--------|
| Body/Sans | Inter | Plus Jakarta Sans |
| Serif/Headlines | Libre Baskerville | Plus Jakarta Sans (Bold) |
| Labels | Inter | Plus Jakarta Sans (Medium) |

**Impact:** Replace all font references. The design is monofont (Plus Jakarta Sans at different weights), not serif+sans.

### Border Violations

Current code uses `1px solid` borders extensively:
- `auth-input-wrap`: `border-bottom: 1px solid`
- `dashboard-sidebar`: `border-inline-end: 1px solid`
- `dashboard-summary-card div`: `border-bottom: 1px solid`
- `game-card`, `setup-panel`, etc.: `border: 1px solid rgba(255,255,255,0.05)`

**Fix:** Remove all structural borders. Use surface tonal shifts. Only keep ghost borders at `outline-variant` 15% opacity where accessibility requires it.

### Layout Differences

| Component | Current | Stitch Target |
|-----------|---------|---------------|
| Auth panel | Centered narrow card (~20.5rem) | Full-width centered card with more breathing room |
| Dashboard sidebar | Emerald gradient | `surface-container-lowest` to `surface-container-low` |
| Game cards | 1px border cards | Borderless tonal cards |
| New Game modal | Narrow overlay | Wider glass panel |

### Missing Design Elements

- No `backdrop-blur` glassmorphism on modals
- No tonal surface hierarchy (everything uses arbitrary rgba values)
- No ambient shadow specification
- Missing chip glow effects on selected states
- No hover-to-`surface-container-highest` transitions on cards
- Button roundedness varies (should be consistent `xl` / `full`)

---

## 8. Spacing Scale

Based on Stitch `spacingScale: 2`:

| Token | Value |
|-------|-------|
| `spacing-1` | 0.25rem (4px) |
| `spacing-2` | 0.5rem (8px) |
| `spacing-3` | 0.75rem (12px) |
| `spacing-4` | 1rem (16px) |
| `spacing-6` | 1.5rem (24px) |
| `spacing-8` | 2rem (32px) |
| `spacing-10` | 2.5rem (40px) |
| `spacing-12` | 3rem (48px) |

Use `spacing-6` and `spacing-8` generously for breathing room.

---

## 9. Roundedness

Stitch setting: `ROUND_EIGHT` (8px base)

| Element | Radius |
|---------|--------|
| Cards / Panels | `1.5rem` (xl) |
| Buttons (primary/CTA) | `1.5rem` (xl) |
| Chips / Pills | `9999px` (full) |
| Inputs | `0.5rem` (sm) |
| Modals | `1.5rem` (xl) |

---

## 10. Do's and Don'ts

### Do
- Use spacing scale strictly for breathing room (especially `spacing-6`, `spacing-8`)
- Use vibrant accents (`secondary` green, `tertiary` gold) **sparingly** for wins/prestige only
- Use `full` roundedness for action buttons — friendly and touchable
- Use `surface-container` nesting for depth instead of lines

### Don't
- Use 100% opaque black or white — always themed tokens
- Use 1px solid borders — shatters the Neon Conservatory illusion
- Crowd the interface — increase nesting depth instead of adding lines
- Use standard drop shadows — only ambient shadow spec
- Use borders to separate sections — use background tonal shifts

---

## 11. Implementation Priority

1. **Color system** — Update `_variables.scss` and Tailwind config to Stitch tokens
2. **Typography** — Replace Libre Baskerville + Inter with Plus Jakarta Sans
3. **Auth screen** — Match Stitch "Auth Screen (Desktop) v2"
4. **Landing page** — Match Stitch "Whist - Home (Desktop)" landing
5. **Dashboard** — Match Stitch "Home Dashboard (Desktop)"
6. **Game screens** — Bidding, Tricks, Score Table, Round History, Round Summary
7. **Modals** — New Game Setup, Invitation, Confirm dialogs
8. **Mobile responsive** — Match mobile Stitch screens at 390px
