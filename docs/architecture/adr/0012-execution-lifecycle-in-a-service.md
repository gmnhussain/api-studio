# ADR-0012: Execution lifecycle in a service, TanStack Query deferred

- Status: Accepted
- Date: 2026-10-14
- Amends: [ADR-0004](./0004-state-management.md) (its TanStack Query decision)

## Context

ADR-0004 planned TanStack Query for the execution lifecycle: a `useExecuteRequest()` mutation per tab, with cancel and retry. Building M4 showed two problems:

- An execution outlives the component that started it. The response panel, the console, the status bar and the tab strip all read the same result, and closing a tab must cancel its request. A mutation's state lives in the component that owns it; sharing it means copying it into a store anyway.
- The provider costs about 13 KB of initial JavaScript, against a budget with 2 KB to spare, for no feature that needs caching yet.

## Decision

- The **execution service** (`features/execution`) owns the lifecycle: it plans the request, picks the executor, runs it and records the result in the **execution store** (one entry per tab, serializable). Abort controllers live in a registry keyed by tab inside the service, as state-management.md requires for non-serializable handles.
- One execution per tab: sending again aborts the previous one, and a late result is ignored by its execution id. Retry repeats the exact request last sent.
- TanStack Query is not installed. It is added, behind a lazily loaded provider, the first time a feature needs request caching or deduplication (history response bodies in M6 are the likely first).

## Alternatives considered

- **`useMutation` plus a store:** the mutation would only mirror what the store already holds, and its cancel needs the same registry.
- **Keeping the provider "for later":** pays the bundle cost now for nothing.

## Consequences

- The rest of ADR-0004 stands: one store per domain, I/O in services.
- The execution flow is testable without React (`execution.service.test.ts`).
- When TanStack Query arrives, the decision for that feature is recorded in its pull request and in state-management.md.
