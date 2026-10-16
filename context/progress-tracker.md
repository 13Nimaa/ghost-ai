# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1 — Foundation & Design System

## Current Goal

- Provide the base editor chrome — top navbar and floating project sidebar shell (`02-editor-chrome.md`).

## Completed

- `01-design-system.md` — shadcn/ui initialized and configured (Tailwind v4, style `radix-nova`, Lucide icons). Added `components/ui/` primitives: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea. `lucide-react` installed. `lib/utils.ts` exposes `cn()` (re-exported from the `cn` package, a clsx + tailwind-merge replacement). Verified with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- `02-editor-chrome.md` — added `components/editor/editor-navbar.tsx` (fixed-height bar, left/center/right sections, sidebar toggle switching between `PanelLeftOpen`/`PanelLeftClose`), `components/editor/project-sidebar.tsx` (floating overlay that slides in from the left, `Projects` header + close button, shadcn `Tabs` for My Projects / Shared with empty placeholder states, full-width `New Project` button with `Plus` icon), and `components/editor/editor-dialog.tsx` (token-styled dialog pattern exposing title, description, and footer — no concrete dialogs yet). Wired the Ghost design tokens into `app/globals.css` and mounted the chrome at a visible `/editor` route. Verified with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

## In Progress

- None yet.

## Next Up

- Continue with the next feature spec.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- shadcn/ui is configured with the `radix-nova` style (Radix primitives, `class-variance-authority`, Lucide icons, Tailwind v4 CSS variables). Generated `components/ui/*` files are treated as protected foundation components and must not be hand-edited.
- `lib/utils.ts` re-exports `cn` from the `cn` package (a compiled drop-in for `clsx` + `tailwind-merge`), rather than hand-rolling the helper.
- The Ghost design tokens documented in `ui-context.md` are now the canonical styling tokens. They live as CSS custom properties in `app/globals.css` and are mapped to Tailwind utilities via `@theme inline`. shadcn's own tokens remain only for the internals of generated `components/ui/*` primitives.
- Tailwind naming note: `--color-base` is only used for backgrounds (`bg-base`) because `text-base` collides with Tailwind's font-size utility. Text colors use the `copy-*` namespace (`text-copy-primary`, `text-copy-muted`, etc.).
- Editor chrome components live in `components/editor/` and contain composition only — no business logic.
- `/editor` (`app/editor/page.tsx`) is a scaffold route that hosts the chrome with shared sidebar open/close state so the layout is visible and verifiable. It is not the final workspace route.

## Session Notes

- shadcn init added `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"` to `app/globals.css` and introduced shadcn theme tokens (`--background`, `--card`, `--primary`, etc.). Those remain for generated component internals.
- Fixed a font-token regression from shadcn init: `@theme inline` mapped `--font-sans` to itself (`var(--font-sans)`), which is undefined. Pointed `--font-sans`/`--font-heading` back at `var(--font-geist-sans)` to match `layout.tsx` and `ui-context.md`.
- `components/ui/*` import `cn` from the `cn` package directly (generated convention); this is expected and left untouched.
- Wired the Ghost tokens: CSS variables (`--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-subtle`, `--border-default`, `--border-subtle`, `--text-*`, `--accent-primary`, `--accent-primary-dim`, `--accent-ai`, `--accent-ai-text`, `--state-*`) plus `@theme inline` mappings (`bg-base`, `bg-surface`, `bg-elevated`, `bg-subtle`, `border-surface-border`, `border-subtle-border`, `text-copy-*`, `text-brand`, `bg-accent-dim`, `text-ai`, `text-ai-text`, `text-state-*`). The base `body` now applies `bg-base text-copy-primary`.
- Set `dark` on `<html>` in `app/layout.tsx` so shadcn's component tokens resolve to dark values (the app is dark-only).
- `components/editor/editor-dialog.tsx` wraps shadcn `Dialog` and overrides its surface with the Ghost tokens (elevated background, surface border, `rounded-3xl`, backdrop blur). It is a reusable pattern only — no dialogs are instantiated yet.
