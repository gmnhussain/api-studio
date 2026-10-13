# ADR-0007: ESLint + Prettier for lint and format

- Status: Accepted
- Date: 2026-10-13

## Context

The app is heavily asynchronous (executions, IndexedDB writes, aborts). A forgotten `await` or an unhandled promise is a silent bug, and a non-exhaustive `switch` over a union (auth, body, protocol) is a missed case.

## Decision

- **ESLint** flat config with `typescript-eslint` `strictTypeChecked`, `eslint-config-next`, React Hooks rules, `import-x` and `jsx-a11y`; **Prettier** for formatting. Shared presets in `packages/config`.
- Required rules include `no-floating-promises`, `no-misused-promises`, `switch-exhaustiveness-check`, `consistent-type-imports`, `no-explicit-any`, `no-console`, `import-x/no-cycle`.

## Alternatives considered

- **Biome:** much faster and a single tool, but type-aware linting is less complete and the Next.js / React Hooks rules are not official.

## Consequences

- Type-aware rules catch async and exhaustiveness bugs at lint time.
- Linting is slower than Biome; mitigated by Turborepo caching.
