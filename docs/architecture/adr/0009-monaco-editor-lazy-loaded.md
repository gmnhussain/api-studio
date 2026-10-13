# ADR-0009: Monaco Editor, lazy-loaded

- Status: Accepted
- Date: 2026-10-13

## Context

Request bodies and responses need a real code editor: highlighting, folding, search, bracket matching, large documents. The product should feel like VS Code.

## Decision

- Monaco via `@monaco-editor/react`, loaded only on the client (`next/dynamic`, `ssr: false`) when an editor first appears.
- Monaco themes generated from our design tokens, so the editor matches dark and light mode exactly.
- One `CodeEditor` wrapper in `components/common` hides Monaco from features. Single-line inputs (URL bar, table cells) are lightweight custom inputs with variable highlighting, not Monaco.
- Large response bodies are formatted in a Web Worker before reaching the editor.

## Alternatives considered

- **CodeMirror 6:** much smaller and modular; a strong option. Monaco wins on the VS Code feel, JSON features and familiarity. The wrapper keeps a later switch contained.

## Consequences

- A large chunk (about 2 MB) that must never be in the initial route bundle; it loads behind a skeleton.
- Theming and the wrapper API need care to stay library-agnostic.
