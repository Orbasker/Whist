# Figma Design Plan — Whist Scoring App

## 1. Overview

This document outlines the plan for creating a Figma design file for the Whist card-game scoring application.  
The app targets two platforms:

| Platform | Tech | Entry point |
|----------|------|-------------|
| Web | Angular 18 + Tailwind CSS | `angular-web/` |
| Mobile | Flutter | `flutter_mobile/` |

The design file will serve as the **single source of truth** for UI decisions and will be shared with developers via Figma's inspect panel. All tokens defined here must stay in sync with `tailwind.config.js` and `_shadcn-theme.scss` (web) and the Flutter theme (mobile).

---

## 2. Figma File Structure

```
📁 Whist – Design System
├── 📄 Cover                    (project info, version, last updated)
├── 📄 Design Tokens            (colors, typography, spacing, radii, shadows)
├── 📄 Component Library        (atoms → molecules → organisms)
├── 📄 Web – Screens            (Angular web views, LTR + RTL variants)
├── 📄 Mobile – Screens         (Flutter mobile views)
└── 📄 Flows & Prototypes       (interactive click-through prototype)
```

Each page uses a **1440 px frame** for web and **390 × 844 px** (iPhone 14) for mobile.  
RTL variants sit beside the LTR frame on the same canvas with the suffix `[RTL]`.

---

## 3. Design Tokens

Map directly to the values already in `tailwind.config.js` and the planned `_shadcn-theme.scss`.

### 3.1 Color Palette

| Token name | CSS variable | Default value (HSL) | Usage |
|---|---|---|---|
| `background` | `--background` | `222 47% 11%` (slate-900) | Page background |
| `foreground` | `--foreground` | `210 40% 98%` | Primary text |
| `card` | `--card` | `217 33% 17%` (slate-800) | Card / panel surface |
| `card-foreground` | `--card-foreground` | `210 40% 98%` | Text on cards |
| `primary` | `--primary` | `38 92% 50%` (amber-500) | CTA buttons, active highlights |
| `primary-foreground` | `--primary-foreground` | `222 47% 11%` | Text on primary |
| `secondary` | `--secondary` | `217 33% 17%` (slate-800) | Secondary buttons / badges |
| `muted` | `--muted` | `215 28% 25%` (slate-700) | Disabled, placeholder surfaces |
| `muted-foreground` | `--muted-foreground` | `215 20% 65%` (slate-400) | Placeholder text |
| `accent` | `--accent` | `38 92% 50%` (amber-500) | Hover state overlays |
| `border` | `--border` | `215 28% 25%` (slate-700) | Input / card borders |
| `input` | `--input` | `215 28% 25%` | Input field border |
| `ring` | `--ring` | `38 92% 50%` | Focus ring |
| `destructive` | `--destructive` | `0 84% 60%` | Error / delete actions |
| `success` | `--success` | `142 71% 45%` | Positive score, success states |

### 3.2 Typography

| Style name | Font | Weight | Size | Line height | Usage |
|---|---|---|---|---|---|
| `Display/XL` | Inter (web) / Rubik (mobile) | 700 | 36 px | 44 px | Game title |
| `Heading/1` | Inter / Rubik | 700 | 24 px | 32 px | Section headings |
| `Heading/2` | Inter / Rubik | 600 | 20 px | 28 px | Card headings |
| `Heading/3` | Inter / Rubik | 600 | 16 px | 24 px | Sub-headings |
| `Body/Regular` | Inter / Rubik | 400 | 14 px | 20 px | Default body |
| `Body/Medium` | Inter / Rubik | 500 | 14 px | 20 px | Emphasized body |
| `Body/Small` | Inter / Rubik | 400 | 12 px | 16 px | Captions, labels |
| `Mono` | JetBrains Mono | 500 | 14 px | 20 px | Score numbers |

> **RTL note:** Use **Rubik** for Hebrew text (excellent RTL support). All text-align and direction properties flip automatically in Figma RTL frames.

### 3.3 Spacing Scale

Uses a 4 px base unit matching Tailwind's default scale:  
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px`

### 3.4 Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 4 px | Badges, chips |
| `radius` (md) | 8 px | Inputs, small buttons |
| `radius-lg` | 12 px | Cards, modals |
| `radius-xl` | 16 px | Bottom sheets (mobile) |
| `radius-full` | 9999 px | Pill buttons, avatars |

### 3.5 Shadows / Elevation

| Level | Box shadow | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | Inputs |
| `shadow` | `0 4px 8px rgba(0,0,0,0.5)` | Cards |
| `shadow-lg` | `0 16px 32px rgba(0,0,0,0.6)` | Modals |

---

## 4. Component Library

Components are built from small to large: **Atoms → Molecules → Organisms**.

### 4.1 Atoms

| Component | Variants | Notes |
|---|---|---|
| **Button** | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; sizes `sm`, `md`, `lg`; states `default`, `hover`, `active`, `disabled`, `loading` | Min touch target 44 × 44 px |
| **Input** | `default`, `error`, `disabled`; with/without leading icon | shadcn-style border + focus ring |
| **Label** | Standard | 12 px, muted-foreground |
| **Badge** | `default`, `secondary`, `destructive`, `outline`, `success` | Pill or squared |
| **Icon** | All trump suits (♠ ♣ ♦ ♥), arrow, close, check, menu | 20 × 20 px, 24 × 24 px |
| **Avatar** | Initials only (no photo for v1) | 32 px, 40 px |
| **Divider** | Horizontal, with/without label | 1 px, border color |
| **Spinner / Loader** | Circular | Used for async states |

### 4.2 Molecules

| Component | Description |
|---|---|
| **Card** | Card + CardHeader + CardTitle + CardDescription + CardContent + CardFooter |
| **FormField** | Label + Input + error message |
| **PlayerBidRow** | Player name + bid stepper (−/+/value) |
| **PlayerTricksRow** | Player name + tricks stepper + bid indicator |
| **TrumpSelector** | 4 suit buttons + "No Trump" option, selected state |
| **ScoreRow** | Round number + 4 score cells + mode badge |
| **RoundSummaryCard** | Round #, trump suit, bids vs tricks table, mode label |
| **Toast / Snackbar** | Success, error, info; auto-dismiss |

### 4.3 Organisms

| Component | Description |
|---|---|
| **Header / AppBar** | App logo + game name + round counter + language toggle |
| **Footer** | Language switcher (EN / עברית) + app version |
| **Modal** | Overlay + Card + title + body + footer actions |
| **ConfirmModal** | Modal variant with confirm/cancel buttons |
| **BiddingPhase** | Trump selector + 4 × PlayerBidRow + total indicator + submit |
| **TricksPhase** | 4 × PlayerTricksRow + running total + submit |
| **ScoreTable** | Header row + n × ScoreRow + totals row |
| **ScoreboardPanel** | Full game leaderboard, collapsible |
| **RoundHistory** | List of RoundSummaryCards |

---

## 5. Screens

### 5.1 Web Screens (1440 px)

| # | Screen | Route | Description |
|---|---|---|---|
| W1 | **Login / Register** | `/login`, `/register` | Auth card centred; email + password fields; toggle to register; guest play link |
| W2 | **Home** | `/` | Game list (owned + participating); "New Game" CTA; empty state |
| W3 | **New Game Setup** | `/game/new` | Player name inputs (4); start game button |
| W4 | **Game – Bidding** | `/game/:id` | TrumpSelector + BiddingPhase; round header; current scores summary |
| W5 | **Game – Tricks** | `/game/:id` | TricksPhase; bids recap per player |
| W6 | **Game – Round Summary** | `/game/:id` | RoundSummaryCard + updated ScoreTable; "Next Round" / "End Game" |
| W7 | **Game – Score History** | `/game/:id/history` | Full RoundHistory list |
| W8 | **Game – Final Scores** | `/game/:id/end` | Winner announcement + final ScoreTable + "New Game" CTA |
| W9 | **Invite Players** | `/invite/:code` | Share link / QR code; player join form |
| W10 | **404 / Error** | `*` | Error illustration + "Go Home" button |

Each screen needs:
- Default (LTR, English)
- `[RTL]` variant (Hebrew)
- Responsive breakpoints: mobile 375 px, tablet 768 px, desktop 1440 px (use Figma constraints / auto layout)

### 5.2 Mobile Screens (390 × 844 px — Flutter)

| # | Screen | Description |
|---|---|---|
| M1 | **Splash / Onboarding** | App logo animation; get started |
| M2 | **Login / Register** | Same flow as W1 adapted for mobile |
| M3 | **Home** | Game cards list; FAB for "New Game" |
| M4 | **New Game Setup** | Step-by-step player name entry |
| M5 | **Game – Bidding** | Full-screen bidding; sticky trump bar |
| M6 | **Game – Tricks** | Full-screen tricks entry |
| M7 | **Game – Round Summary** | Bottom sheet overlay over game |
| M8 | **Game – Score Table** | Horizontal scroll if > 4 columns |
| M9 | **Game – Final Scores** | Winner card + full history |
| M10 | **Settings** | Language, theme (future), account info |

---

## 6. Flows & Prototypes

The following user flows should be linked as interactive prototypes in the **Flows & Prototypes** page.

| Flow | Start screen | End screen | Key interactions |
|---|---|---|---|
| **New game flow** | W2 Home | W4 Bidding | Create game → name players → start |
| **Full round flow** | W4 Bidding | W6 Round Summary | Bid → select trump → submit → tricks → submit → summary |
| **Multi-round game** | W4 Bidding | W8 Final Scores | Repeat round flow × N → end game |
| **Auth flow** | W1 Login | W2 Home | Login / register / password reset |
| **Invite flow** | W2 Home | W4 Bidding | Share link → recipient joins → game starts |
| **Mobile full round** | M5 Bidding | M7 Round Summary | Same as web, adapted for touch |

---

## 7. Design Principles & Constraints

| Principle | Detail |
|---|---|
| **Dark-first** | Default theme is dark (slate-900 background, amber-500 accents). Light mode is out of scope for v1. |
| **RTL support** | Every component and screen must have a Hebrew / RTL variant. Use Figma's RTL text direction and mirror layout. |
| **Touch targets** | All interactive elements minimum 44 × 44 px (mobile and web) per WCAG 2.5.5. |
| **Accessibility** | Contrast ratios: text on background ≥ 4.5:1 (AA). Focus rings visible on all focusable elements. |
| **Consistent spacing** | Use 4 px grid. No arbitrary values. |
| **Component reuse** | Build with auto layout + components + variants so any change propagates everywhere. |

---

## 8. Handoff Guidelines

1. **Component naming**: follow the pattern `ComponentName/Variant/State` (e.g., `Button/Primary/Hover`).
2. **Layer naming**: every layer must be named (no "Group 42"). Use the same names as the Angular/Flutter component names where possible.
3. **Tokens as styles**: all colors, fonts, and effects must be Figma styles (or Figma variables in variable mode) so they map 1-to-1 with CSS variables and Tailwind tokens.
4. **Export**: all icons exported as SVG. Illustrations exported as SVG + PNG @2×.
5. **Annotations**: use Figma's dev mode annotation feature to document interaction states, animation durations, and any non-obvious behaviour.
6. **Version control**: use Figma branches for feature work; merge into `main` branch before handoff.
7. **Sharing**: share the file with developers in "can view" mode; use "can edit" only for designers.

---

## 9. Deliverables & Milestones

| Milestone | Deliverable | Target |
|---|---|---|
| **M0 – Setup** | Figma file created; token styles added; fonts loaded | Day 1 |
| **M1 – Atoms** | All atom components with variants and states | Day 3 |
| **M2 – Molecules** | All molecule components | Day 5 |
| **M3 – Organisms** | Header, Footer, Modal, BiddingPhase, TricksPhase, ScoreTable | Day 7 |
| **M4 – Web Screens** | W1–W10 LTR frames completed | Day 10 |
| **M5 – RTL Variants** | W1–W10 RTL variants completed | Day 12 |
| **M6 – Mobile Screens** | M1–M10 frames completed | Day 15 |
| **M7 – Prototypes** | All 6 flows linked and interactive | Day 17 |
| **M8 – Review & Handoff** | Design review with team; dev mode enabled; annotations done | Day 18 |

---

## 10. Tools & Collaboration

| Tool | Purpose |
|---|---|
| **Figma** (main file) | Design, prototyping, handoff |
| **Figma Dev Mode** | Developer inspect + annotation |
| **Figma Variables** | Map design tokens to code tokens (Figma v2 variables) |
| **FigJam** (optional) | User flow whiteboarding before screen design |
| **GitHub Issues** | Track design tasks linked to this repo |
| **Zeplin / Storybook** (optional) | Secondary handoff if needed |

---

## 11. Open Questions

- [ ] Should guest (unauthenticated) users be able to start a game without logging in? (affects W3 / M4 flow)
- [ ] Is a light mode theme planned for any near-term phase?
- [ ] Are any custom illustrations or card art needed, or is the app purely typographic/icon-based?
- [ ] What is the maximum number of rounds in a game? (affects ScoreTable height / scroll strategy)
- [ ] Should mobile support landscape orientation?

---

*Document owner: Design team*  
*Last updated: 2026-03-20*  
*Related docs: `docs/DESIGN_PROPOSAL_SHADCN_TAILWIND.md`, `docs/plan/future-phases.md`*
