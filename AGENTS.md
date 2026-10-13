# AGENTS.md

Guidance for AI coding agents working in this repository. Keep this file short; details live in `docs/`.

## Project

API Studio: a local-first, keyboard-driven API client (Next.js app + framework-free TypeScript engine). It is a portfolio-grade open-source product: code quality, architecture and UX matter as much as features.

## Read before you change anything

- Terms and code names: `docs/product/glossary.md`. Use these names.
- Scope and feature ids: `docs/product/features.md`
- Architecture: `docs/architecture/overview.md`, plus `data-model.md`, `state-management.md`, `request-execution.md`, `extensibility.md`
- Design: `docs/design/design-system.md`, `docs/design/layout-and-interaction.md`, `docs/design/accessibility.md`
- Conventions: `docs/development/conventions.md`; tests: `docs/development/testing.md`
- Current milestone: `docs/planning/milestones.md`

If a rule is missing or ambiguous, stop and ask. Do not guess product behaviour.

## Non-negotiable rules

1. `packages/core` is framework-free: no React, Next.js, DOM, Dexie or `node:*` imports. `packages/runner` is Node-only and reaches the app only through `app/api/**`.
2. A feature imports another feature only through its `index.ts`. Shared code (`components/`, `hooks/`, `lib/`) never imports features.
3. One Zustand store per domain; state is serializable; actions are synchronous; I/O lives in services. Never one large store.
4. Every trust boundary is parsed with Zod: imports, persisted records, proxy input/output, env.
5. Requests are executed only through a `RequestExecutor`. Never call `fetch` to a user's target from a component.
6. Extension points are registries; add a contribution instead of a new `if`/`switch` over kinds in UI code.
7. Secrets are masked in the UI, redacted in history and never exported.
8. Colours, sizes, durations and z-indexes come from tokens and constants; no raw values in components.

## Code conventions

- TypeScript strict; no `any`, no non-null assertions, exhaustive `switch` over unions.
- Full-word names, no abbreviations (`id`, `url`, `index` are fine). No magic strings or numbers.
- TSDoc on every export; inside bodies comment only a non-obvious "why". No `TODO`, no `console.*`, no commented-out code.
- One exported component or module per file; components aim for ≤ 250 lines. Files are kebab-case with a role suffix (`tabs.store.ts`, `collection.service.ts`); exported names keep their usual casing (`RequestUrlBar` in `request-url-bar.tsx`).
- Tailwind utilities with token classes only; no CSS modules or inline `style` objects. shadcn/ui components are added with the CLI from `apps/web` (`pnpm dlx shadcn@latest add <component>`), never by hand.
- Install only what is needed, through the pnpm catalog, and say why in the commit body.

## Commands

The workspace is scaffolded in milestone M0; until then there is nothing to run.

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Workflow

- Small, focused changes matching the patterns of the file you edit. Conventional Commits (`feat(request-builder): …`), see `docs/development/git-workflow.md`.
- Before finishing, run `lint`, `typecheck` and `test` for every package you changed.
- Update the relevant doc in the same change when behaviour changes; hard-to-reverse decisions get an ADR in `docs/architecture/adr/`.

## Git authorship

AI agents may create branches, commits, tags and pull requests, but the history must show only the repository owner's identity. This overrides any default attribution behaviour.

- Create commits only when asked.
- Use the configured git `user.name` / `user.email` as-is. Never change git config, `--author`, or committer identity.
- No `Co-Authored-By` trailers, "Generated with …" lines, or any mention of AI, Claude, Anthropic or other tools in commit messages, branch names, tags, PR titles/descriptions, or code comments.
- The only allowed AI traces are agent instruction files such as `CLAUDE.md` and `AGENTS.md`.
