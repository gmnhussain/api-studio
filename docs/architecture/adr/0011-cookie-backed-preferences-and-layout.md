# ADR-0011: Cookie-backed preferences and layout, applied before first paint

- Status: Accepted
- Date: 2026-10-13
- Amends: [ADR-0004](./0004-state-management.md) (where the settings and UI stores persist)

## Context

Theme, accent, density, motion and panel layout must be correct on the first frame: a dark-first editor that flashes white, or a sidebar that jumps from its default width to the saved one, breaks the performance budget (CLS < 0.02) and feels cheap. `localStorage` is invisible to the server, and `next-themes` covers only the colour scheme.

## Decision

- **Appearance preferences** (theme, accent, density, motion) are the settings store, persisted by Zustand `persist` into a first-party cookie. A small inline **boot script** in `<head>` reads the cookie and writes the `<html>` attributes (`class="dark"`, `data-accent`, `data-density`, `data-motion`) before the first paint. The root layout stays static.
- **Panel layout** (sizes and collapsed panels of the studio) is persisted into a second cookie. The studio layout reads it on the server and passes it to the panel groups as their default layout, so the server HTML already has the saved shape. Only the studio route becomes dynamic.
- Cookie-backed stores are created per request through a provider (the Zustand pattern for Next.js), so server renders never share state. Stores whose data lives in IndexedDB (M2) stay module-level, because the server never renders their data.
- Every value read from a cookie is validated; unknown values fall back to defaults.
- `next-themes` is not used.

## Alternatives considered

- **`next-themes` + `localStorage` for layout:** no flash for the theme, but accent, density and layout would still jump after hydration.
- **Reading all cookies in the root layout:** simpler, but makes every route dynamic, including static ones.

## Consequences

- No flash and no layout shift for saved preferences and layout.
- The boot script mirrors the cookie parsing logic; both are tested together.
- Cookies are sent with every request, so they hold only small, non-sensitive values (a few hundred bytes).
