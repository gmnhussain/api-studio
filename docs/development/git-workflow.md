# Git Workflow

**`main` holds released code, `develop` holds integrated work. Every commit follows Conventional Commits and carries only the repository owner's identity.**

## Branches

| Branch | Purpose | Rules |
| --- | --- | --- |
| `main` | Released, tagged versions | Changes only by merging `develop` (or a `hotfix/*`). Protected: PR, green CI, linear history |
| `develop` | Integration branch; always builds and passes CI | Day-to-day work lands here |
| `feat/<scope>-<topic>` | A feature, cut from `develop` | Short-lived; merged back with a PR (squash or rebase) |
| `fix/<scope>-<topic>` | A bug fix, cut from `develop` | Same as features |
| `docs/…`, `chore/…`, `refactor/…` | Non-feature work | Same as features |
| `release/vX.Y.Z` | Optional stabilisation before a release | Only fixes, docs and the version bump |
| `hotfix/vX.Y.Z` | Urgent fix to a release, cut from `main` | Merged into `main` and back into `develop` |

Branch names are lowercase kebab-case: `feat/request-builder-auth-editor`, `fix/tabs-restore-order`.

During the foundation phase, work is committed directly on `develop` in small commits. Once CI exists (milestone M0), each milestone's features go through `feat/*` branches and pull requests into `develop`, so the history shows reviewed, CI-checked changes.

## Releases

1. `develop` is green and the milestone's exit criteria are met.
2. Merge `develop` → `main` by pull request.
3. Tag `vX.Y.Z` on `main` (Semantic Versioning; `0.y.z` until the first stable release).
4. `CHANGELOG.md` is generated from the Conventional Commits since the previous tag.
5. The hosted demo deploys from `main`; previews deploy from pull requests.

## Commit messages

[Conventional Commits 1.0](https://www.conventionalcommits.org/), checked by commitlint in CI.

```text
<type>(<scope>): <summary in imperative mood, lower case, no period>

<optional body: why the change was made, what alternatives were rejected>

<optional footer: BREAKING CHANGE: …, Refs #123>
```

| Type | Use |
| --- | --- |
| `feat` | A user-visible feature |
| `fix` | A bug fix |
| `perf` | A performance improvement |
| `refactor` | Code change with no behaviour change |
| `style` | Formatting only |
| `test` | Tests only |
| `docs` | Documentation only |
| `build` | Build system, dependencies |
| `ci` | CI configuration |
| `chore` | Repository maintenance |
| `revert` | Reverts a previous commit |

Scopes are optional; when used, they must be one of the following (enforced by `scope-enum` in `commitlint.config.js`, which is the source of truth):

| Group | Scopes |
| --- | --- |
| Packages and apps | `core`, `runner`, `config`, `web` |
| Features | `shell`, `workspace`, `collections`, `request-builder`, `response-viewer`, `execution`, `tabs`, `history`, `environments`, `console`, `command-palette`, `search`, `code-generation`, `import-export`, `settings`, `onboarding` |
| Docs and repository | `design`, `architecture`, `adr`, `product`, `development`, `planning`, `deps`, `ci`, `github` |

Examples:

```text
feat(request-builder): sync query parameters with the url
fix(runner): switch to GET after a 303 redirect
perf(response-viewer): format large json bodies in a worker
docs(adr): propose lazy-loaded Monaco Editor
build(deps): add dexie for indexeddb persistence
```

Rules:

- One logical change per commit; the build passes at every commit.
- Summary ≤ 72 characters; body wrapped at 100.
- A dependency added or upgraded is explained in the body.

## Authorship

The history shows only the repository owner's identity.

- Commits use the configured git `user.name` / `user.email` as-is; no `--author` overrides.
- No `Co-Authored-By` trailers, "Generated with …" lines, or mentions of AI tools in commit messages, branch names, tags, pull requests or code comments.
- Agent instruction files (`CLAUDE.md`, `AGENTS.md`) are the only allowed traces of AI tooling.
