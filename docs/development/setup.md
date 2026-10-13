# Setup

**Node 24 and pnpm 11, then `pnpm install` and `pnpm dev`. No database, no Docker, no accounts.**

## Requirements

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 24 LTS (`.nvmrc`) | `nvm use` / `fnm use` picks it up |
| pnpm | 11.5 (`packageManager` in `package.json`) | `corepack enable` installs the pinned version |
| Git | 2.40+ | Line endings are normalised to LF by `.gitattributes` |

Recommended editor: VS Code with the extensions in `.vscode/extensions.json` (ESLint, Prettier, Tailwind CSS IntelliSense). Format on save is preconfigured.

## First run

```bash
corepack enable
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the web app in development mode |
| `pnpm build` | Production build of every package that has one |
| `pnpm typecheck` | TypeScript in every package |
| `pnpm lint` | ESLint in every package |
| `pnpm format` / `pnpm format:check` | Prettier write / check |
| `pnpm test` | Unit and integration tests |
| `pnpm test:unit` / `pnpm test:integration` | One kind only |
| `pnpm test:watch` | Unit tests in watch mode |
| `pnpm test:coverage` | Unit tests with coverage |
| `pnpm depcruise` | Module boundary rules |

Run a task for one package with `--filter`, e.g. `pnpm --filter @api-studio/core test:unit`.

## Workspace

| Package | Path | Purpose |
| --- | --- | --- |
| `@api-studio/web` | `apps/web` | Next.js application |
| `@api-studio/core` | `packages/core` | Framework-free engine |
| `@api-studio/runner` | `packages/runner` | Node HTTP execution engine |
| `@api-studio/config` | `packages/config` | Shared TypeScript, ESLint, Prettier and Vitest presets |

## Adding things

- **A dependency:** add the version to the catalog in `pnpm-workspace.yaml`, then reference it as `"catalog:"` in the package. Explain why in the commit body.
- **A shadcn/ui component:** from `apps/web`, run `pnpm shadcn add <component>`.
- **A package:** copy the shape of `packages/core` (package.json scripts, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`) and add its boundary rules to `.dependency-cruiser.cjs`.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `pnpm` refuses to run an install script | pnpm 11 blocks them by default; allow a package in `allowBuilds` in `pnpm-workspace.yaml` only if it needs it |
| Editor shows stale lint errors | Restart the ESLint server; type-aware rules cache the TypeScript program |
| Wrong Node version | `nvm use` (or `fnm use`) in the repository root |
