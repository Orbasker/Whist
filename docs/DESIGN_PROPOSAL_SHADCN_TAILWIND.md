# UI Design Proposal: shadcn-style + Tailwind

**Branch:** `ui/shadcn-tailwind-poc`  
**Scope:** Frontend/UI only — no backend changes.

---

## 1. Summary

This proposal introduces a **shadcn-inspired design system** on top of **Tailwind CSS** for the Whist Angular app. The goal is a consistent, maintainable UI with semantic tokens and reusable components that match the shadcn/ui visual language (borders, radius, focus rings, variants) while staying framework-agnostic and Tailwind-first.

---

## 2. Before vs After

### Before

- **Styling mix:** Some screens (Home, Game) used Tailwind utility classes; Auth and Footer used **custom SCSS** and **CSS variables** from `_variables.scss` and `_theme.scss`.
- **No shared component library:** Buttons, inputs, cards were styled ad hoc (inline Tailwind or component SCSS).
- **Tokens:** Slate/amber palette and a few semantic vars (`--bg-primary`, `--accent-primary`, etc.) in `_variables.scss`; Tailwind theme duplicated some colors in `tailwind.config.js`.

### After (PoC on this branch)

- **Single design token layer:** `_shadcn-theme.scss` defines semantic CSS variables (`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--ring`, etc.) that map into Tailwind via `theme.extend.colors` and `theme.extend.borderRadius`.
- **Reusable UI primitives:** New Angular components under `app/shared/components/ui/`:
  - **Button** – variants: default, destructive, outline, secondary, ghost, link.
  - **Card** – Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
  - **Input** – wrapper that applies shadcn-style input styling (global `.ui-input` class).
  - **Label** – semantic form label.
  - **Badge** – default, secondary, destructive, outline.
- **Auth screen:** Refactored to use the new Card, Button, Input, Label and Tailwind only; **Auth component SCSS removed** in favor of utilities and design tokens.
- **Footer:** Refactored to Tailwind + semantic tokens; **Footer SCSS reduced** to a comment.
- **Global styles:** New `@layer components` block for `.ui-input` so inputs get consistent height, border, focus ring, and placeholder styling.

---

## 3. Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Semantic tokens in CSS + Tailwind** | One source of truth for colors/radius; theme changes (e.g. light mode later) only touch `_shadcn-theme.scss` and optional Tailwind theme. |
| **Angular components, not a React port** | shadcn/ui is React + Radix; we keep Angular and replicate the *style* (tokens, class names, variants) with native Angular components. |
| **Tailwind-first layout and spacing** | All layout and spacing use Tailwind utilities; no custom SCSS for layout. Component SCSS only where necessary (e.g. modal layout). |
| **Keep existing palette (slate + amber)** | `_shadcn-theme.scss` maps current slate/amber into semantic names so the app look stays consistent while gaining a clear design system. |
| **Touch targets and a11y** | `min-h-touch` / `min-w-touch` (44px) and `focus-visible:ring-2` kept; RTL and existing focus behavior unchanged. |
| **PoC scope** | Proof-of-concept extends to Auth, Footer, Home, Game (bidding phase, tricks phase, score table, round summary), and shared components (modal, trump selector). |

---

## 4. Files Touched (PoC)

| Area | Files |
|------|--------|
| **Design system** | `src/styles/_shadcn-theme.scss` (new), `src/styles.scss` (import + `.ui-input` layer), `tailwind.config.js` (semantic colors + radius) |
| **UI components** | `src/app/shared/components/ui/button/`, `ui/card/`, `ui/input/`, `ui/label/`, `ui/badge/` (new) |
| **Auth** | `auth.component.html` (rewritten with Card, Button, Input, Label), `auth.component.ts` (imports), `auth.component.scss` (can be removed or kept minimal) |
| **Footer** | `footer.component.html` (Tailwind only), `footer.component.scss` (minimal) |
| **Home** | `home.component.html`, `home.component.ts` (Card, Button, modals, game list styling) |
| **Game** | `game.component` (layout, sticky sections), `bidding-phase/`, `tricks-phase/`, `score-table/`, `round-summary/` (Tailwind + tokens) |
| **Shared** | `modal/`, `trump-selector/`, `confirm-modal/` |
| **Docs** | `docs/DESIGN_PROPOSAL_SHADCN_TAILWIND.md` (this file) |

---

## 5. Migration Path (Full App)

1. **Phase 1 (this PoC):** Auth, Footer, Home, Game (bidding/tricks/score-table/round-summary), and shared modal/trump-selector on new tokens + UI components. ✅
2. **Phase 2:** Any remaining ad hoc styles replaced with semantic Tailwind and UI components.
3. **Phase 3:** Game screen and shared components – consolidate tokens for borders/backgrounds and UI components where they fit.
4. **Phase 4:** Remove or slim down legacy `_variables.scss` and any duplicate Tailwind color definitions; rely on `_shadcn-theme.scss` + Tailwind theme for all UI colors.

---

## 6. How to Try the PoC

```bash
git checkout ui/shadcn-tailwind-poc
cd angular-web && npm install && npm run start
```

- Open **/login** (or sign up) to see the new Auth card and form.
- Check the **footer** language switcher for the new button styling.
- No backend or env changes required.

---

## 7. Acceptance Criteria

- [x] Design proposal or mockup (this doc + PoC branch).
- [x] Clear before/after and design decisions documented.
- [x] Scope is frontend/UI only.
