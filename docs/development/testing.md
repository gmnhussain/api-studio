# Testing

**The engine is proven by fast unit tests, the proxy by integration tests against a real local server, and the product by a small set of end-to-end journeys in real browsers.**

## Pyramid

| Level | Tool | What | Where |
| --- | --- | --- | --- |
| Unit | Vitest | `packages/core` (resolver, URL/params sync, auth, body serialization, codegen, importers, migrations, search), store actions, selectors, pure utils | `*.test.ts` next to the code |
| Component | Vitest + Testing Library (jsdom) + `user-event` | Interactive components: key-value table, variable input, tree keyboard model, tabs, palette | `*.test.tsx` next to the component |
| Integration | Vitest + a local Node HTTP test server | `packages/runner`: redirects, timeouts, cancel, size cap, SSRF guard, timings, error mapping; the `/api/v1/executions` route | `*.int.test.ts` in `packages/runner/test`, `apps/web/test` |
| End-to-end | Playwright (Chromium, Firefox, WebKit) + axe | Critical journeys, keyboard shortcuts, accessibility, both themes | `apps/web/e2e/*.spec.ts` |
| Visual (later) | Playwright screenshots | Shell, empty states, response views in dark and light | `apps/web/e2e/visual/` |

## Required coverage

| Area | Target |
| --- | --- |
| `packages/core` | ≥ 90% lines, 100% branches for variable resolution, URL ⇄ params sync and migrations |
| `packages/runner` | Every `ExecutionError` code has a test that produces it |
| Code generators | Golden files for every target × body type × auth scheme, plus escaping cases |
| Importers | A fixture per supported format and version, including unsupported-feature warnings |
| Collection document | A fixture per `schemaVersion` that must keep importing forever |
| Stores | Every action; persisted stores' `migrate` functions |

## Golden tests

Code generators and importers are tested against committed expected outputs in `__golden__/` folders. A changed golden file in a diff is reviewed as a behaviour change. Update them only deliberately (`pnpm test:golden:update`).

## E2E journeys (v0.1)

1. First run: onboarding → sample request sent → response shown.
2. Create collection → new request → send to the local test API → save → reload → tab and draft restored.
3. Environment: define `baseUrl` and `token` → use `{{baseUrl}}` with autocomplete → switch environment → URL resolves differently.
4. Paste a cURL command into the URL bar → request filled in → send.
5. Collections: drag a request into a folder; rename with `F2`; duplicate; delete and undo.
6. Response: JSON tree, raw, preview of HTML and image; copy and download.
7. Export a collection → import it into a new workspace → identical tree.
8. Keyboard-only run of journey 2, with axe checks in dark and light.

E2E tests run against `apps/web` with a bundled test API (`apps/web/e2e/support/test-api.ts`) so they never depend on the internet.

## Test data

- Factories (`createRequestDefinition({ overrides })`) build valid entities with defaults; no shared mutable fixtures.
- Stores are reset to `getInitialState()` before each test; IndexedDB uses `fake-indexeddb` in unit and component tests.
- No real third-party APIs in any automated test.

## Running

```bash
pnpm test               # unit + component + integration
pnpm test:unit
pnpm test:integration
pnpm test:watch
pnpm test:coverage
pnpm test:e2e           # Playwright (builds and starts the app)
```

## CI gates (every push and pull request)

1. Install with frozen lockfile
2. Typecheck
3. ESLint + Prettier check
4. Unit, component and integration tests
5. dependency-cruiser boundary rules
6. Build
7. E2E with axe accessibility checks (Chromium on every PR; Chromium, Firefox and WebKit on `main` and `develop`)
8. Performance budgets: initial JavaScript, LCP and layout shift ([performance.md](./performance.md#budgets))
9. Dependency audit (`pnpm audit --prod`)
10. Commit messages (commitlint)
