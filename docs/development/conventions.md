# Conventions

How code is written in this repository. Lint rules enforce what they can; review enforces the rest.

## General

- TypeScript `strict` everywhere, plus `noUncheckedIndexedAccess`. No `any`: use `unknown` and narrow, or a precise generic. No non-null assertions (`!`) outside tests.
- Names from the [glossary](../product/glossary.md). One concept, one name, everywhere.
- Full-word names; no abbreviations (`request`, not `req`; `response`, not `res`; `milliseconds`, not `ms` in identifiers). Common short names such as `id`, `url`, `index`, `http` are fine.
- No magic values: strings and numbers with meaning live in `constants/` (app) or a `<module>.constants.ts` file (core / feature), typed `as const`.
- One concern per change; match the patterns of the file you edit.
- Reuse and extend existing components, utilities and path aliases before adding new ones. Avoid over-engineering: add an abstraction when the second real use appears.
- Prefer composition (props, slots, hooks, small functions) over inheritance; no classes for UI. Classes only where a contract needs instances (e.g. a repository implementation).
- SOLID in practice: one reason to change per module; extend through registries (open–closed); depend on interfaces such as `RequestExecutor` and repositories (dependency inversion).

## Comments and documentation

- **Every exported function, hook, component, store and type has a TSDoc block**: what it does, its contract (inputs, outputs, errors), and anything surprising. Keep it short.
- Complex components (tree, tables, editor, tabs, palette) start with a short block explaining their interaction model.
- Inside function bodies, comment only a non-obvious *why* (`// RFC 9110 §15.4.4: 303 always switches to GET`). No comments that narrate what the code does.
- No `TODO` / `FIXME` comments: open an issue instead. No commented-out code.
- No `console.*` (lint error). App-level logging goes through the console feature's `log()` service.

## Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Files and folders | kebab-case, with a role suffix where one applies | `collection.store.ts`, `request-url-bar.tsx` |
| Components | PascalCase, file named after the component | `RequestUrlBar` in `request-url-bar.tsx` |
| Hooks | `use` + PascalCase, file `use-*.ts` | `useActiveDraft` in `use-active-draft.ts` |
| Variables, functions | camelCase, verbs for functions | `resolveVariables`, `buildCurlCommand` |
| Booleans | `is` / `has` / `can` / `should` prefix | `isPinned`, `canSetForbiddenHeaders` |
| Types, interfaces | PascalCase, no `I` prefix, no `Type` suffix | `RequestExecutor`, `AuthConfig` |
| Zod schemas | camelCase + `Schema` | `requestDefinitionSchema` |
| Constants | UPPER_SNAKE_CASE | `MAX_RESPONSE_BYTES` |
| Enum-like values | snake_case string literals | `"url_encoded"`, `"api_key"` |
| Ids | Branded types `XxxId` | `CollectionId` |
| Event handlers | `handle*` inside, `on*` as props | `onSend` prop, `handleSend` |
| Command ids | `feature.action` | `request.send`, `tabs.close` |
| Storage keys, query keys | From one factory per feature | `STORAGE_KEYS.tabs`, `historyQueryKeys.body(id)` |

### Role suffixes

| Suffix | Contains |
| --- | --- |
| `.store.ts` | A Zustand store |
| `.selectors.ts` | Pure selector functions for a store |
| `.service.ts` | Orchestration: stores + repositories + side effects |
| `.repository.ts` | Persistence access only |
| `.schema.ts` | Zod schemas (types inferred next to them) |
| `.types.ts` | Types without a schema |
| `.constants.ts` | Typed constants |
| `.utils.ts` | Pure helpers private to a module |
| `.commands.ts` | Commands and key bindings a feature contributes |
| `.contributions.ts` | Registry registrations of a feature |
| `.test.ts(x)` / `.int.test.ts` / `.spec.ts` | Unit / integration / Playwright tests |

## Files and modules

- One exported component or module per file; small private helpers used only by it may stay. Exception: the parts of one compound component that are only used together may share a file (`Panel`, `PanelHeader`, `PanelBody`), as in the shadcn/ui primitives.
- Components aim for **≤ 250 lines**; split by extracting subcomponents and hooks. Longer only with a stated reason in review.
- Each feature exposes a public API in `index.ts`; nothing else in a feature may be imported from outside it.
- No barrel files except a feature's or package's `index.ts`.
- Imports ordered by `import-x/order` (builtin → external → `@api-studio/*` → `@/*` → relative, a blank line between groups, alphabetical within); type-only imports use `import type` and stay in their source's group.
- Path aliases: `@/*` → `apps/web/src/*`; packages through their names (`@api-studio/core`).

## TypeScript

- Model with discriminated unions and exhaustive `switch` (lint enforced); add an `assertNever` default where it helps readers.
- Types come from Zod schemas at trust boundaries (`z.infer`); internal-only types are plain TypeScript.
- Prefer `type` aliases; use `interface` for contracts that implementations satisfy (`RequestExecutor`, `CodeGenerator`).
- `readonly` for arrays and objects that must not be mutated across module boundaries.
- Expected failures are values (`Result<T, E>` from core); exceptions are for bugs and truly exceptional states.
- No enums (`const` objects + literal unions instead); no namespaces; no default exports except where Next.js requires them (pages, layouts, route handlers, config files).

## React and Next.js

- Server Components by default for layouts and static pages; the studio itself is a client island under `(studio)/layout.tsx`. `"use client"` goes as deep as possible.
- Components receive data through props or selectors; they never call repositories, executors or `fetch` directly.
- No `useEffect` for derived state or event handling; effects only to sync with something outside React (Monaco, `BroadcastChannel`, keyboard listeners), always cleaned up.
- The React Compiler handles memoisation; add `memo` / `useMemo` / `useCallback` only when profiling shows a need, with a comment saying why.
- Lists use stable ids as keys, never the index.
- Heavy or rarely used UI (Monaco, previews, code generation dialog, import dialog, settings sections, onboarding) is loaded with `next/dynamic` or `React.lazy` behind `Suspense` with a skeleton.
- Every route segment has an `error.tsx`; dynamic segments also have a `loading.tsx` skeleton shaped like the page (static pages have nothing to wait for).
- Animations use `m.*` from `motion/react-m`, never `motion.*`: the app runs under `LazyMotion strict`, which throws on the full component so it cannot grow the bundle. Durations and easings come from the motion tokens.
- Media queries come from `constants/breakpoints.ts` through `useMediaQuery`, which renders the wide layout on the server and corrects without a hydration mismatch.

## Styling

- Tailwind utility classes only, using token utilities (`bg-surface`, `text-muted-foreground`); no raw colour values, no arbitrary values unless a token can't express it.
- No CSS modules, no inline `style` objects (except dynamic values that can't be classes, e.g. a virtual list offset).
- Variants with `class-variance-authority`; class merging with `cn()` (`clsx` + `tailwind-merge`).
- shadcn/ui components are added with the pinned CLI (`pnpm shadcn add <component>` from `apps/web`), never by hand, then adjusted to our tokens. `pnpm dlx shadcn` does not work under pnpm 11.
- No other UI library unless agreed in an ADR.

## State, forms and validation

- State rules in [state-management.md](../architecture/state-management.md).
- Forms: React Hook Form + `zodResolver` with the domain schema; errors shown under the field.
- Validate at every trust boundary with Zod: imported files, persisted records on read, proxy request and response, environment variables.
- Schemas that run in the browser import `zod/mini` (`import * as z from "zod/mini"`), which tree-shakes; the full `zod` API costs about 50 KB of initial JavaScript ([performance.md](./performance.md#strategies)). Server-only code (env validation, the runner) may use `zod`.
- Values read from cookies and storage fall back field by field (`z.catch`), so one stale value never resets the rest.

## Configuration

- Environment variables are validated with Zod in `config/env.ts` (server) and `config/public-env.ts` (`NEXT_PUBLIC_*`); invalid config stops startup.
- `.env.example` lists every variable with a safe local default; no secrets in the repo.

## Dependencies

- Install only what is needed; prefer what the repo already has. Add new dependencies through the catalog in `pnpm-workspace.yaml` and say why in the commit body.
- Runtime dependencies are checked for size (bundle analyzer) and maintenance before adding.

## Definition of done

1. `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass for every changed package.
2. New logic has tests; new UI has at least a role-based component test or an E2E step.
3. Keyboard and screen-reader behaviour checked for new interactive UI.
4. Docs updated in the same change when behaviour or architecture changes; an ADR for hard-to-reverse decisions.
5. No `any`, `console`, `TODO`, or unused exports.
