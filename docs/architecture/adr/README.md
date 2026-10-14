# Architecture Decision Records

One file per significant, hard-to-reverse decision. Never edit an accepted ADR's decision; write a new ADR that supersedes it. The architecture review accepted ADRs 0001–0009 on 2026-10-13.

| ADR                                                    | Title                                                            | Status   |
| ------------------------------------------------------ | ---------------------------------------------------------------- | -------- |
| [0001](./0001-monorepo-with-framework-free-core.md)    | pnpm + Turborepo monorepo with a framework-free core             | Accepted |
| [0002](./0002-local-first-indexeddb-persistence.md)    | Local-first persistence in IndexedDB behind repositories         | Accepted |
| [0003](./0003-request-execution-through-proxy.md)      | Execute requests through a server-side proxy by default          | Accepted |
| [0004](./0004-state-management.md)                     | Zustand stores per domain, TanStack Query for async I/O          | Accepted |
| [0005](./0005-protocol-adapters.md)                    | Protocol adapters and contribution registries                    | Accepted |
| [0006](./0006-versioned-collection-format.md)          | Native, versioned collection document                            | Accepted |
| [0007](./0007-eslint-prettier.md)                      | ESLint + Prettier for lint and format                            | Accepted |
| [0008](./0008-dnd-kit-for-drag-and-drop.md)            | dnd-kit for drag and drop                                        | Accepted |
| [0009](./0009-monaco-editor-lazy-loaded.md)            | Monaco Editor, lazy-loaded                                       | Accepted |
| [0010](./0010-ui-text-in-message-catalog.md)           | UI text in a message catalog (next-intl)                         | Accepted |
| [0011](./0011-cookie-backed-preferences-and-layout.md) | Cookie-backed preferences and layout, applied before first paint | Accepted |

## Template

```markdown
# ADR-NNNN: Title

- Status: Proposed | Accepted | Superseded by ADR-XXXX
- Date: YYYY-MM-DD

## Context

What problem or force makes a decision necessary?

## Decision

What we will do.

## Alternatives considered

Each option and why it was not chosen.

## Consequences

What becomes easier, what becomes harder, what we must now do.
```
