# ADR-0005: Protocol adapters and contribution registries

- Status: Accepted
- Date: 2026-10-13

## Context

GraphQL, WebSocket, SSE, gRPC, plugins and more code generators are on the roadmap. Hard-coding HTTP or a fixed list of generators into components would force a rewrite for each.

## Decision

- `RequestDefinition` is a union discriminated by `protocol`; each protocol has a `ProtocolAdapter`.
- Extension points are typed registries (`createRegistry()`): protocols, auth schemes, body types, code generators, importers, response viewers, commands, sidebar sections, executors.
- Built-in features register through the same API that plugins will use.

## Alternatives considered

- **`if (protocol === …)` branches:** quick for one protocol, but grows into scattered conditionals.
- **Plugin system first:** premature; the registries give the same seams without committing to a public API.

## Consequences

- A new protocol, generator or viewer is an addition (open–closed principle).
- A little indirection: features look contributions up in registries instead of importing them directly.
