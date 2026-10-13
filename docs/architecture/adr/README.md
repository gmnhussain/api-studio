# Architecture Decision Records

One file per significant, hard-to-reverse decision. Never edit an accepted ADR's decision; write a new ADR that supersedes it. Proposed ADRs become Accepted after the architecture review.

| ADR | Title | Status |
| --- | --- | --- |
| [0001](./0001-monorepo-with-framework-free-core.md) | pnpm + Turborepo monorepo with a framework-free core | Proposed |
| [0002](./0002-local-first-indexeddb-persistence.md) | Local-first persistence in IndexedDB behind repositories | Proposed |
| [0003](./0003-request-execution-through-proxy.md) | Execute requests through a server-side proxy by default | Proposed |
| [0004](./0004-state-management.md) | Zustand stores per domain, TanStack Query for async I/O | Proposed |
| [0005](./0005-protocol-adapters.md) | Protocol adapters and contribution registries | Proposed |
| [0006](./0006-versioned-collection-format.md) | Native, versioned collection document | Proposed |
| [0007](./0007-eslint-prettier.md) | ESLint + Prettier for lint and format | Proposed |
| [0008](./0008-dnd-kit-for-drag-and-drop.md) | dnd-kit for drag and drop | Proposed |
| [0009](./0009-monaco-editor-lazy-loaded.md) | Monaco Editor, lazy-loaded | Proposed |

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
