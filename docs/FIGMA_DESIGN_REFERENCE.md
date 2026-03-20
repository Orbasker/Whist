# Whist – Figma Design Reference

> **Purpose:** This document captures the complete app flow, mobile design tokens, screen inventory, and component specifications so that a Figma canvas can be built to guide UI/UX improvements.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [App Flow Diagram](#2-app-flow-diagram)
3. [Design Tokens](#3-design-tokens)
   - [Color Palette](#31-color-palette)
   - [Typography](#32-typography)
   - [Spacing & Layout](#33-spacing--layout)
   - [Border Radius](#34-border-radius)
   - [Elevation & Shadows](#35-elevation--shadows)
4. [Screen Inventory](#4-screen-inventory)
   - [1 – Splash / Loading](#41-splash--loading)
   - [2 – Auth Screen (Login)](#42-auth-screen--login)
   - [3 – Auth Screen (Sign Up)](#43-auth-screen--sign-up)
   - [4 – Home Screen](#44-home-screen)
   - [5 – New Game Form (Modal)](#45-new-game-form-modal)
   - [6 – Game Screen (Bidding Phase)](#46-game-screen--bidding-phase)
   - [7 – Game Screen (Tricks Phase)](#47-game-screen--tricks-phase)
   - [8 – Round Summary Dialog](#48-round-summary-dialog)
   - [9 – Score Table (Bottom Sheet)](#49-score-table--bottom-sheet)
   - [10 – Round History Screen](#410-round-history-screen)
   - [11 – Invitation Form (Dialog)](#411-invitation-form-dialog)
   - [12 – OAuth Web View](#412-oauth-web-view)
5. [Component Library](#5-component-library)
   - [Buttons](#51-buttons)
   - [Inputs / Text Fields](#52-inputs--text-fields)
   - [Cards](#53-cards)
   - [Status Badges](#54-status-badges)
   - [Trump Selector](#55-trump-selector)
   - [Bid / Tricks Input Grid](#56-bid--tricks-input-grid)
   - [Player Bid Card](#57-player-bid-card)
   - [Player Trick Card](#58-player-trick-card)
   - [Realtime Indicator](#59-realtime-indicator)
   - [Gradient Background](#510-gradient-background)
   - [Divider with Label](#511-divider-with-label)
   - [Error Banner](#512-error-banner)
   - [Score Table Row](#513-score-table-row)
   - [Game List Tile](#514-game-list-tile)
6. [Navigation Model](#6-navigation-model)
7. [RTL Support](#7-rtl-support)
8. [Suggested Figma Canvas Layout](#8-suggested-figma-canvas-layout)

---

## 1. Project Overview

**Whist** is a 4-player card-game scoring app available as:

| Platform | Stack |
|---|---|
| Mobile | Flutter (Material 3, dark theme) |
| Web | Angular + Tailwind/shadcn (dark theme) |
| Backend | FastAPI + PostgreSQL |

Both frontends share the same dark color palette and design language. This document focuses on the **Flutter mobile app** because that is the primary candidate for Figma-driven UI/UX improvements.

### Core User Journey (one sentence)

> A user signs in, creates or opens a Whist game, enters **bids** and a **trump suit** at the start of each round, then enters how many **tricks** each player actually won at the end of the round; the app calculates and displays running scores after every round.

---

## 2. App Flow Diagram

```
App Launch
    │
    ▼
[Splash / Loading]  ← AuthGate loading session from storage
    │
    ├─ session found ──────────────────────────────────────────────────┐
    │                                                                   │
    ▼                                                                   ▼
[Auth Screen]                                                     [Home Screen]
 ├─ Login tab                                                          │
 │   ├─ Email + Password form                                          ├─ My Games list
 │   ├─ "Sign In" filled button                                        │    └─ tap game → [Game Screen]
 │   └─ "Continue with Google" outlined button                         │
 │       └─ [OAuth WebView] → returns token                            ├─ "New Game +" button
 │           └─ completeOAuthSignIn() → success → Home                 │    └─ [New Game Form modal]
 │                                                                      │        ├─ optional game name
 └─ Sign Up tab                                                         │        ├─ 4 player name fields
     ├─ Name + Email + Password form                                    │        └─ "Start Game" → [Game Screen]
     └─ "Sign Up" filled button                                         │
                                                                        └─ logout → [Auth Screen]
                                                                    [Game Screen]
                                                                        │
                                                         ┌──── Bidding Phase ─────────────────────────┐
                                                         │                                             │
                                                         │  AppBar: Round count · "Bidding"            │
                                                         │  Actions: realtime dot | history | score    │
                                                         │           | account (logout) | language     │
                                                         │                                             │
                                                         │  Body:                                      │
                                                         │   Trump Selector (5 chips)                  │
                                                         │   Total Bids card + progress bar            │
                                                         │   Score Table / History shortcut buttons    │
                                                         │   Player Bid Cards × 4 (bid grid + lock)    │
                                                         │   "Continue →" FilledButton                 │
                                                         │                                             │
                                                         └─ submit bids → Tricks Phase ───────────────┘
                                                                                │
                                                         ┌──── Tricks Phase ───────────────────────────┐
                                                         │                                              │
                                                         │  AppBar: Round count · "Tricks"              │
                                                         │  Body:                                       │
                                                         │   Total tricks counter bar                   │
                                                         │   Score Table / History shortcut buttons     │
                                                         │   Player Trick Cards × 4 (trick grid)        │
                                                         │   "Finish Round" FilledButton                │
                                                         │                                              │
                                                         └─ submit tricks → [Round Summary Dialog]      │
                                                                │                                       │
                                                                │ "Next Round" → Bidding Phase          │
                                                                └───────────────────────────────────────┘

 Accessible from Game Screen (any phase):
  ├─ [Score Table Bottom Sheet]  → shows current scores, rounds played, invite, delete
  │      └─ "Invite" button → [Invitation Form Dialog]
  └─ [Round History Screen] (push nav) → full per-round table (bid/took/change/before/after)
```

---

## 3. Design Tokens

### 3.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0F172A` | Scaffold / page background (deep dark blue-slate) |
| `foreground` | `#F1F5F9` | Body text, icons |
| `card` | `#1A2744` | Card backgrounds, dialogs, bottom sheets |
| `primary` | `#0EA5E9` | Sky-blue accent: links, active states, progress, badges |
| `primaryForeground` | `#0F172A` | Text on primary backgrounds |
| `secondary` / `border` / `muted` | `#203349` | Card borders, input fills/borders, muted backgrounds |
| `mutedForeground` | `#94A3B8` | Placeholder text, secondary labels |
| `buttonPrimary` | `#D97706` | FilledButton background (amber-600) |
| `buttonPrimaryHover` | `#F59E0B` | FilledButton hover / pressed (amber-500) |
| `destructive` | `#EF4444` | Errors, delete actions |
| `success` | `#22C55E` | Positive scores, realtime connected indicator |
| `gradientFrom/To` | `#0F172A` | Screen gradient endpoints |
| `gradientVia` | `#1A2744` | Screen gradient midpoint |

**Screen background gradient:**
`background (#0F172A) → card (#1A2744) → background (#0F172A)`, top-left to bottom-right (135°).

### 3.2 Typography

**Font family:** [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts, all weights)

| Role | Size | Weight | Color |
|---|---|---|---|
| `headlineMedium` (page title) | ~28 px | 700 | foreground |
| `headlineSmall` (card title, bids total) | ~24 px | 700 | foreground |
| `titleLarge` (section headers) | ~22 px | 600 | foreground |
| `titleMedium` (player name, sub-headers) | ~16 px | 500–600 | foreground |
| `titleSmall` (smaller section labels) | ~14 px | 500 | foreground |
| `bodyMedium` (normal body, subtitles) | ~14 px | 400 | foreground / muted |
| `bodySmall` (meta text, dates) | ~12 px | 400 | mutedForeground |
| `labelSmall` (badges, chips) | ~11 px | 500 | varies by badge |
| AppBar title | 18 px | 600 | foreground |
| Button text | 15 px | 600 | white or foreground |
| Label text | 14 px | 600 | mutedForeground |
| Hint text | 14 px | 400 | mutedForeground @70% |
| Error text | 13 px | 400 | destructive |

### 3.3 Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| Page horizontal padding | 24 px | AuthScreen, HomeScreen hero |
| Page horizontal padding (game) | 16 px | Bidding / Tricks phase scroll |
| Card inner padding | 16 px | All cards |
| Dialog inner padding | 24 px | Auth card, new-game modal |
| List item padding | 12 px vertical × 12 px horizontal | Game list tile |
| Between form fields | 16 px | Auth forms |
| Between sections | 20 px | Bidding phase sections |
| Button min height | 44 px | All interactive controls |
| Input min height | 44 px | All text inputs |
| Icon button min size | 44 × 44 px | All icon buttons |
| App icon container | 56 × 56 px | Home screen hero |
| Game tile icon | 44 × 44 px | Game list icon circle |

### 3.4 Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 8 px | Buttons, inputs, error banners, small chips |
| `radius-md` | 12 px | Game list tile, Trump chip (selected), icon circle |
| `radius-lg` | 16 px | Cards, dialogs, auth card, bottom sheet top |
| `radius-xl` | 20 px | Status badges ("You", "Active") |
| App icon | 12 px | Home trophy icon container |
| Circle | 50% | Game list item icon, Realtime indicator |

### 3.5 Elevation & Shadows

| Surface | Elevation | Shadow |
|---|---|---|
| Card | 0 (flat) + 1 px border | none |
| Auth / NewGame card | 8 dp shadow | `Colors.black @30%` |
| Score Table bottom sheet | raised | `Colors.black26`, blur 12, offset (0, -4) |
| Dialog | Material default | — |

---

## 4. Screen Inventory

### 4.1 Splash / Loading

**Route:** Initial  
**Purpose:** Shown while `AuthService.loadSession()` is running.

| Element | Details |
|---|---|
| Background | Scaffold default (`background #0F172A`) |
| Content | Centered `CircularProgressIndicator` (primary sky-blue) |

---

### 4.2 Auth Screen – Login

**Route:** `AuthScreen` (isLoginMode = true)  
**Background:** Full-screen gradient (`GradientBackground`)

| Zone | Element | Details |
|---|---|---|
| Center card | Card (max width 400 px, 24 px padding) | 16 px radius, card bg, 8 dp shadow |
| Heading | "Sign In" | headlineSmall, bold, centered |
| Error banner | Conditional | red bg + border, 8 px radius (shown on failure) |
| Field 1 | Email TextFormField | label "Email", hint "Enter your email" |
| Field 2 | Password TextFormField (obscured) | label "Password", hint "Enter your password" |
| CTA button | FilledButton "Sign In" | amber, full-width, 44 px min height |
| Divider | "— or —" | 1 px border, muted foreground label |
| Google button | OutlinedButton.icon "Continue with Google" | Google blue "g" icon, full-width |
| Toggle | TextButton "Sign Up" | primary (sky blue), centered below card |

---

### 4.3 Auth Screen – Sign Up

**Route:** `AuthScreen` (isLoginMode = false)

| Zone | Element | Details |
|---|---|---|
| Same card layout | — | — |
| Heading | "Sign Up" | headlineSmall, bold |
| Field 1 | Name TextFormField | label "Name", hint "Enter your name" |
| Field 2 | Email TextFormField | — |
| Field 3 | Password TextFormField (obscured) | — |
| CTA button | FilledButton "Sign Up" | amber |
| Toggle | TextButton "Sign In" | centered |

---

### 4.4 Home Screen

**Route:** `HomeScreen`  
**Background:** Full-screen gradient

#### Hero Section (top)

| Element | Details |
|---|---|
| Trophy icon container | 56 × 56 px, sky-blue bg, 12 px radius, `Icons.emoji_events_outlined` size 32 |
| Title | "Whist" — headlineMedium, bold |
| Subtitle | "Track your Whist game" — bodyMedium, mutedForeground |
| User row | name/email (bodySmall, muted) + TextButton.icon "Log Out" (logout icon, size 16) |

#### My Games Card

| Element | Details |
|---|---|
| Container | Card with 16 px padding |
| Header | Row: "My Games" titleLarge + FilledButton.icon "+ New Game" (amber) |
| States | Loading spinner / Error (red text + OutlinedButton "Retry") / Empty state / List |
| Empty state | "No games yet" bodyLarge + "Create a game to start playing" bodySmall |
| Game list | `ListView.separated` with 8 px gaps, each item = **Game List Tile** |

---

### 4.5 New Game Form (Modal)

**Trigger:** "+ New Game" button on Home Screen  
**Presentation:** Full-screen overlay with `ModalBarrier (Colors.black54)` + centered Card

| Element | Details |
|---|---|
| Card | 24 px padding, 8 dp shadow, max 400 px wide |
| Header | Row: "New Game" titleLarge + IconButton close |
| Game name | TextFormField optional, label "Game name (optional)" |
| Section label | "Player Names" titleSmall |
| Player fields | 4 × TextFormField labelled "Player 1" … "Player 4", 12 px gaps |
| Error | Red text if any field empty |
| Footer | Row: OutlinedButton "Cancel" + FilledButton "Start Game" (amber) |

---

### 4.6 Game Screen – Bidding Phase

**Route:** `GameScreen` (phase = bidding)

#### AppBar

| Element | Details |
|---|---|
| Leading | `Icons.arrow_back` → back to Home |
| Title | "X rounds played · Bidding" |
| Divider | 1 px bottom border (`AppColors.border`) |
| Actions | Realtime dot (10 px) · History icon · Score icon · Account/Logout · Language menu |

#### Body (scrollable)

| Section | Element | Details |
|---|---|---|
| Heading | "Enter Bids" | headlineSmall, bold |
| Subheading | "Select how many tricks each player predicts they will win" | bodyMedium, muted |
| Trump section | "Trump Suit:" titleMedium + **TrumpSelector** | horizontal chip row |
| Total Bids card | Card with header "Total Bids", large number, progress bar (10 px high), status message | |
| Shortcut row | OutlinedButton.icon "Score (N rounds)" + IconButton history list | |
| Player Cards × 4 | **Player Bid Card** × 4, 16 px bottom gap each | |
| Submit | FilledButton "Continue →" full-width | amber, 14 px vertical padding |

---

### 4.7 Game Screen – Tricks Phase

**Route:** `GameScreen` (phase = tricks)

#### AppBar

| Element | Same as bidding phase but title shows "X rounds played · Tricks" |
|---|---|

#### Body (scrollable)

| Section | Element | Details |
|---|---|---|
| Question | "How many tricks did each player win?" | bodyMedium, muted |
| Total bar | Highlighted container showing "Total: N" | primaryContainer bg @30%, 12 px radius |
| Shortcut row | OutlinedButton.icon "Score (N rounds)" + IconButton.filled history | |
| Player Cards × 4 | **Player Trick Card** × 4, 16 px bottom gap | |
| Submit | FilledButton "Finish Round" / validation message | amber, 16 px padding |

---

### 4.8 Round Summary Dialog

**Trigger:** Automatic after submitting tricks (if enough data)  
**Presentation:** `AlertDialog`, `barrierDismissible: false`

| Element | Details |
|---|---|
| Title | "Round Summary" |
| Content | 4 × **Player Summary Row** with 12 px gaps |
| Action | FilledButton "Next Round →" (amber) |

#### Player Summary Row

| Element | Details |
|---|---|
| Container | 12 px padding, 1 px border @30% opacity, 8 px radius |
| Left | Player name (titleSmall bold) + "Bid X · Took Y" (bodySmall, muted) |
| Right | `+N` / `-N` score (titleMedium bold, green/red/neutral) + "Total: Z" (bodySmall, muted) |

---

### 4.9 Score Table (Bottom Sheet)

**Trigger:** Score icon in AppBar or shortcut button in Bidding/Tricks phase  
**Presentation:** `showModalBottomSheet`, scrollable, 16 px top radius

| Element | Details |
|---|---|
| Header | "Score Table" titleLarge bold + close `IconButton` |
| Current Score card | 4-column grid: player name (muted) above score (green/red/neutral, bold) |
| Rounds played | "X round(s) played" bodySmall, muted, centered |
| Owner actions | FilledButton.tonalIcon "Invite" (mail icon) + FilledButton.tonalIcon "Delete Game" (red) |
| Dismiss | OutlinedButton "Close" full-width (or right of owner actions) |

---

### 4.10 Round History Screen

**Trigger:** History icon in AppBar or history shortcut button  
**Presentation:** Push navigation, full `Scaffold`

| Element | Details |
|---|---|
| AppBar | "Round History" + `Icons.close` leading |
| Empty state | Centered "No rounds played yet" bodyLarge, muted |
| Table | Horizontally + vertically scrollable `Table` |

#### Table Structure

| Row | Columns |
|---|---|
| Header 1 | Round · Card/Trump · [Player 1 (5 cols)] · [Player 2] · [Player 3] · [Player 4] |
| Header 2 | — · — · Bid · Took · +/- · Before · After (×4 players) |
| Data rows | Round number · trump symbol (♠♣♦♥✕) · bid/took/change/before/after per player |
| Totals row | "Total" + final score per player in "After" column (primary bg tint, 2 px top border) |

**Change column coloring:** green (`success`) for positive, red (`destructive`) for negative.  
**"You" label:** Shown next to the current user's player name in the header (sky blue, 10 px).

---

### 4.11 Invitation Form (Dialog)

**Trigger:** "Invite" button in Score Table (game owner only)  
**Presentation:** `AlertDialog`

| Element | Details |
|---|---|
| Title | "Send Invitations" |
| Game full state | Centered message + "Close" button |
| Normal state | "Invite players" subtitle, game name label |
| Players list | Current players labeled "Player 1: Name" etc. |
| Email fields | TextFields for each open slot (slot index + 1) |
| Error banner | Red error container, 8 px radius |
| Success banner | Primary container, 8 px radius |
| Footer | FilledButton "Send Invitations" + OutlinedButton "Cancel" |

---

### 4.12 OAuth Web View

**Trigger:** "Continue with Google" button  
**Presentation:** `OAuthWebViewScreen` (full-screen WebView)

| Element | Details |
|---|---|
| AppBar | "Sign in" title + back button |
| Body | WebView loading Google OAuth URL |

---

## 5. Component Library

### 5.1 Buttons

#### FilledButton (Primary CTA)

| Property | Value |
|---|---|
| Background | `#D97706` (amber-600) |
| Text color | white |
| Font | Outfit 15 px, weight 600 |
| Min height | 44 px |
| Padding | 20 px horizontal × 10 px vertical |
| Radius | 8 px |
| Disabled | opacity 38% |

#### OutlinedButton (Secondary)

| Property | Value |
|---|---|
| Border | 1 px `#203349` |
| Text color | foreground `#F1F5F9` |
| Font | Outfit 15 px, weight 600 |
| Min height | 44 px |
| Radius | 8 px |

#### TextButton (Tertiary / Toggle)

| Property | Value |
|---|---|
| Text color | `#0EA5E9` (primary sky) |
| Font | Outfit 15 px, weight 600 |
| Min height | 44 px |
| Radius | 8 px |

#### FilledButton.tonal (Accent secondary)

Used for Invite (default tonal) and Delete (red error container variant).

---

### 5.2 Inputs / Text Fields

| Property | Value |
|---|---|
| Background (fill) | `#203349` |
| Border (enabled) | 1 px `#203349` |
| Border (focused) | 2 px `#0EA5E9` (primary) |
| Border (error) | 1 px `#EF4444`; focused: 2 px |
| Radius | 8 px |
| Padding | 12 px horizontal × 12 px vertical |
| Min height | 44 px |
| Label | Outfit 14 px, weight 600, `#94A3B8` |
| Hint | Outfit 14 px, `#94A3B8` @70% |
| Error text | Outfit 13 px, `#EF4444` |

---

### 5.3 Cards

| Property | Value |
|---|---|
| Background | `#1A2744` |
| Border | 1 px `#203349` |
| Radius | 16 px |
| Elevation | 0 (flat) |
| Inner padding | 16 px (default), 24 px (auth/modal) |

---

### 5.4 Status Badges

| Badge | Background | Text | Radius |
|---|---|---|---|
| Active | `#0EA5E9` @20% | `#0EA5E9`, Outfit 11 px, weight 500 | 20 px |
| Completed | `#203349` | `#94A3B8`, Outfit 11 px, weight 500 | 20 px |
| "You" (player) | `#0EA5E9` @20% | `#0EA5E9`, Outfit 11 px, weight 500 | 20 px |
| "Manager" | `surfaceContainerHighest` (#203349) | mutedForeground, 11 px | 20 px |
| Locked bid | inline | `🔒 Locked` error color, 11 px | — |

---

### 5.5 Trump Selector

A horizontal wrap of 5 pill chips:

| Option | Icon | Color |
|---|---|---|
| No trump | ✕ | onSurfaceVariant |
| Spades ♠ | ♠ | onSurfaceVariant |
| Clubs ♣ | ♣ | onSurfaceVariant |
| Diamonds ♦ | ♦ | `Colors.red.shade700` |
| Hearts ♥ | ♥ | `Colors.red.shade700` |

| State | Background | Text/Icon color |
|---|---|---|
| Default | `surfaceContainerHighest` (#203349) | onSurfaceVariant (#94A3B8) |
| Selected | `primary` (#0EA5E9) | `onPrimary` (#0F172A) |

Chip padding: 16 px horizontal × 10 px vertical. Radius: 12 px.  
Icon + 8 px gap + label (Outfit 14 px, weight 500).

---

### 5.6 Bid / Tricks Input Grid

A number grid (0–13 for bids, 0–13 for tricks) rendered as a `Wrap` of tappable chip-style buttons.

| State | Appearance |
|---|---|
| Default | outlined chip, muted border |
| Selected | sky-blue filled chip |
| Disabled | reduced opacity |

Each chip: ~40 px wide, 36 px tall, 6 px radius. One row or 2-row wrap depending on space.

---

### 5.7 Player Bid Card

A `Card` (16 px inner padding, 16 px bottom margin) for each player during bidding.

**Header row:**
- Left: player name (titleMedium, weight 500) + optional "You" badge + optional "Manager" badge + optional "🔒 Locked" text
- Right: bid count + " tricks" (titleMedium bold, sky blue) + optional "(choice)" label

**Body:**
- `BidInputGrid` (enabled or disabled)

**Footer (conditional):**
- FilledButton (amber-600 or tertiary) "Lock in my choice" / "Lock in player's choice" with `Icons.lock` icon

**Selected/Current player:** "You" badge shown.

---

### 5.8 Player Trick Card

A `Card` (16 px inner padding, 16 px bottom margin) for each player during tricks phase.

**Header row:**
- Left: `N tricks` (titleSmall, weight 500)
- Right: player name + optional "You" badge + optional "Manager" badge + `Bid: N` (bodySmall, muted)

**Body:**
- `TricksInputGrid` (always enabled)

---

### 5.9 Realtime Indicator

Small circle icon in the AppBar.

| State | Icon | Color | Size |
|---|---|---|---|
| Connected | `Icons.circle` (filled) | `#22C55E` (success green) | 10 px |
| Disconnected | `Icons.circle_outlined` | outline (`#203349`) | 10 px |

Tooltip: "Live updates connected" / "Realtime disconnected".

---

### 5.10 Gradient Background

Full-screen `DecoratedBox` with a `LinearGradient`:

- Begin: `Alignment.topLeft` → End: `Alignment.bottomRight`
- Colors: `#0F172A` → `#1A2744` → `#0F172A`

Used on: AuthScreen, HomeScreen.

---

### 5.11 Divider with Label

Used on Auth screen between the email/password form and the Google button.

```
── ── ── ──  or  ── ── ── ──
```

- Horizontal `Divider` + padding + Text "or" + padding + `Divider`
- Text: bodySmall, mutedForeground
- Divider: 1 px, `#203349`

---

### 5.12 Error Banner

| Property | Value |
|---|---|
| Background | `#EF4444` @10% |
| Border | 1 px `#EF4444` @50% |
| Text | `#EF4444`, 14 px |
| Padding | 12 px horizontal × 10 px vertical |
| Radius | 8 px |

---

### 5.13 Score Table Row (Round Summary)

| Element | Spec |
|---|---|
| Container | 1 px border @30% opacity, 8 px radius, 12 px padding |
| Left column | Player name (titleSmall, weight 500) + "Bid X · Took Y" (bodySmall, muted) |
| Right column | Round score (+N / -N, titleMedium bold, green/red/neutral) + "Total: Z" (bodySmall, muted) |

---

### 5.14 Game List Tile

A tappable row inside the My Games card.

| Element | Details |
|---|---|
| Container | Card bg `#1A2744`, 12 px radius, 1 px border |
| Icon circle | 44 × 44 px, sky-blue @15% bg, `Icons.emoji_events_outlined` sky-blue 22 px |
| Title | Display name (titleSmall), players (bodySmall, muted), round/score/date (labelSmall, muted) |
| Status badge | "Active" (sky bg @20%) or "Completed" (muted bg) |
| Arrow | `Icons.chevron_right`, onSurfaceVariant |

---

## 6. Navigation Model

```
AuthGate (root, managed by MaterialApp.home)
 └── AuthScreen  ─────────────────── push ──► OAuthWebViewScreen
 └── HomeScreen
       └── GameScreen ──────────────── push ──► RoundHistoryScreen
             ├── showModalBottomSheet  ────────► ScoreTableSheet
             │       └── showDialog ───────────► InvitationForm (AlertDialog)
             └── showDialog ──────────────────► RoundSummaryDialog (AlertDialog)
```

All screens use the same `MaterialApp` theme (`buildAppTheme()`). No light mode exists; the app is always dark.

---

## 7. RTL Support

The app is fully bilingual (English + Hebrew) and supports **RTL layout** for Hebrew.

| Feature | Details |
|---|---|
| Languages | English (`en`), Hebrew (`he`) |
| RTL auto-flip | Flutter handles mirroring automatically |
| Language switcher | `PopupMenuButton` in the Game Screen AppBar, accessible any time |
| Persistence | User's locale preference is stored in local storage via `LocaleProvider` |

In Figma: create **both LTR (English) and RTL (Hebrew)** variants for all screens.

---

## 8. Suggested Figma Canvas Layout

Organise the canvas in this order to mirror the user journey:

### Page 1 – Design System

| Frame | Contents |
|---|---|
| Colors | All 12 color swatches with hex, name, token |
| Typography | All 9 text styles with size/weight/usage |
| Spacing | Spacing scale (8, 12, 16, 20, 24 px) |
| Border Radius | 8/12/16/20 px examples |
| Shadows | Card (flat+border), Elevated (8dp), BottomSheet |

### Page 2 – Components

One frame per component section (5.1–5.14), showing all states (default, hover, active, disabled, error).

### Page 3 – Mobile Screens (LTR / English)

Screens at 390 × 844 px (iPhone 14 size), in flow order:

1. Splash / Loading
2. Auth – Login
3. Auth – Sign Up
4. Home (empty state)
5. Home (with games)
6. New Game Form (modal overlay)
7. Game – Bidding Phase
8. Game – Tricks Phase
9. Round Summary Dialog
10. Score Table (bottom sheet expanded)
11. Round History Screen
12. Invitation Form Dialog

### Page 4 – Mobile Screens (RTL / Hebrew)

Same 12 screens mirrored for RTL layout.

### Page 5 – User Flow

A flowchart (use Figma's arrow connectors) linking every screen frame using the flow diagram from Section 2, annotated with trigger interactions (tap, swipe, auto-transition).

---

*Document generated from source code analysis of the Flutter mobile app (`flutter_mobile/`) and Angular web app (`angular-web/src/styles/`). Last updated: March 2026.*
