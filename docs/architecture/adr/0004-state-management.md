# ADR-0004: Zustand stores per domain, TanStack Query for async I/O

- Status: Accepted; the TanStack Query decision is amended by [ADR-0012](./0012-execution-lifecycle-in-a-service.md)
- Date: 2026-10-13

## Context

The studio has many independent, frequently changing pieces of state (tabs, drafts, collections, environments, layout, console). One large store re-renders too much and couples features.

## Decision

- One Zustand store per domain, owned by its feature: workspace, collection, request (drafts), tabs, history, environment, settings, UI, console.
- Stores hold serializable state and synchronous actions only; services do I/O and optimistic write-through.
- Components subscribe through selectors; derived data comes from selector functions.
- TanStack Query manages async lifecycles: request execution (cancel, retry), lazy body loading, future remote data.

## Alternatives considered

- **Redux Toolkit:** solid, but more ceremony for local, UI-heavy state.
- **Jotai:** atom-level granularity is attractive, but harder to organize by domain and persist.
- **React context:** re-renders every consumer; fine only for static dependencies.

## Consequences

- Features stay isolated; stores stay small and testable.
- Cross-domain flows need an explicit service or hook, by design.
