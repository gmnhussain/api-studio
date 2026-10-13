# @api-studio/config

Shared tooling presets. Every package extends these instead of defining its own.

| Export | Use |
| --- | --- |
| `@api-studio/config/tsconfig/base.json` | Strict TypeScript, bundler resolution, no emit |
| `@api-studio/config/tsconfig/isomorphic.json` | `packages/core`: web-standard globals (`URL`, `AbortSignal`, `TextEncoder`), no Node types |
| `@api-studio/config/tsconfig/node.json` | `packages/runner` and future Node apps |
| `@api-studio/config/tsconfig/nextjs.json` | `apps/web` |
| `@api-studio/config/eslint/{base,isomorphic,node,next}` | ESLint flat config factories, e.g. `node(import.meta.dirname)` |
| `@api-studio/config/prettier` | Prettier config with Tailwind class sorting (re-exported by the root `prettier.config.mjs`) |
| `@api-studio/config/vitest` | Vitest config with `unit` and `integration` projects |

## ESLint presets

| Preset | Adds on top of `base` |
| --- | --- |
| `base` | `typescript-eslint` strict type-checked, `import-x` (order, cycles, duplicates, no default exports), no enums, no `console`, Prettier compatibility |
| `isomorphic` | Bans platform globals (`window`, `document`, `localStorage`, `process`, `Buffer`, …) in `src/` |
| `node` | Node globals |
| `next` | `eslint-config-next` (Core Web Vitals), the full `jsx-a11y` recommended set, `turbo/no-undeclared-env-vars`, default exports allowed in Next.js route files |

TypeScript is pinned to 6.0.x and ESLint to 9.x in `pnpm-workspace.yaml`; the comments there say why.
