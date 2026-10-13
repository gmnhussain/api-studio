# ADR-0001: pnpm + Turborepo monorepo with a framework-free core

- Status: Accepted
- Date: 2026-10-13

## Context

The roadmap includes a CLI, a mock server and possibly a desktop app. They all need the same logic: models, variable resolution, code generation, import/export and HTTP execution. If that logic lives inside React components or Next.js files, it cannot be reused or tested in isolation.

## Decision

- pnpm workspaces + Turborepo; dependency versions pinned once in the pnpm catalog.
- `packages/core` (`@api-studio/core`): pure TypeScript, no React, Next.js, DOM or Node imports.
- `packages/runner` (`@api-studio/runner`): Node HTTP engine used by the proxy and the future CLI.
- `packages/config`: shared ESLint, Prettier, TypeScript and Vitest presets.
- `apps/web`: the Next.js application.
- Boundaries enforced by dependency-cruiser in CI.

## Alternatives considered

- **Single Next.js app with `lib/`:** simpler at first, but nothing stops UI code leaking into engine code, and a CLI would need a later extraction.
- **Nx:** more features (generators, graph UI), but heavier configuration than this repo needs.
- **Separate `packages/ui` now:** only one app consumes components; it waits until a second one exists.

## Consequences

- The engine is unit-tested at full speed without a browser.
- Adding the CLI is a new app, not a refactor.
- Slightly more setup (workspace config, package exports, Turborepo pipeline).
