# ADR-0002: Local-first persistence in IndexedDB behind repositories

- Status: Accepted
- Date: 2026-10-13

## Context

API Studio works without accounts (product principle P1). History and responses can be large (megabytes per response, hundreds of entries); `localStorage` is synchronous, string-only and limited to about 5 MB. Sync and a cloud workspace are on the roadmap.

## Decision

- Domain data (workspaces, collections, items, environments, history, response bodies, drafts, cookie jars) in IndexedDB through **Dexie**.
- Access only through repository interfaces per entity; v1 implements `IndexedDb*Repository`.
- Small, first-paint-critical state (settings, UI layout, tab order) in `localStorage` via Zustand `persist`.
- Every record read is parsed with its Zod schema; schema changes ship with migrations.

## Alternatives considered

- **Zustand `persist` for everything:** one serialized blob rewritten on every change; does not scale to history and response bodies.
- **Raw IndexedDB / `idb`:** workable, but Dexie gives versioned schemas, compound indexes and live queries with little code.
- **OPFS / SQLite WASM:** powerful, but heavier and unnecessary at this scale.

## Consequences

- Large data stays out of synchronous storage.
- Sync becomes a new repository implementation, not a rewrite.
- Hydration is async, so panels need skeleton states (which the design wants anyway).
