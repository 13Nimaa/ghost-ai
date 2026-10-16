# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1 — Foundation & Design System

## Current Goal

- Establish the design system and UI primitive components (`01-design-system.md`).

## Completed

- `01-design-system.md` — shadcn/ui initialized and configured (Tailwind v4, style `radix-nova`, Lucide icons). Added `components/ui/` primitives: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea. `lucide-react` installed. `lib/utils.ts` exposes `cn()` (re-exported from the `cn` package, a clsx + tailwind-merge replacement). Verified with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

## In Progress

- None yet.

## Next Up

- Continue with the next feature spec.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- shadcn/ui is configured with the `radix-nova` style (Radix primitives, `class-variance-authority`, Lucide icons, Tailwind v4 CSS variables). Generated `components/ui/*` files are treated as protected foundation components and must not be hand-edited.
- `lib/utils.ts` re-exports `cn` from the `cn` package (a compiled drop-in for `clsx` + `tailwind-merge`), rather than hand-rolling the helper.

## Session Notes

- shadcn init added `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"` to `app/globals.css` and introduced shadcn theme tokens (`--background`, `--card`, `--primary`, etc.). These are the shadcn tokens; the project's Ghost design tokens (`--bg-base`, `--accent-primary`, etc. documented in `ui-context.md`) are not yet wired up and belong to a later styling unit.
- Fixed a font-token regression from shadcn init: `@theme inline` mapped `--font-sans` to itself (`var(--font-sans)`), which is undefined. Pointed `--font-sans`/`--font-heading` back at `var(--font-geist-sans)` to match `layout.tsx` and `ui-context.md`.
- `components/ui/*` import `cn` from the `cn` package directly (generated convention); this is expected and left untouched.
