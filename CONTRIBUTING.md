# Contributing to API Studio

Thanks for your interest in improving API Studio. This guide covers what you need to make a change that can be merged quickly.

## Before you start

- Read the [documentation map](./docs/README.md), especially the [conventions](./docs/development/conventions.md), [testing](./docs/development/testing.md) and [git workflow](./docs/development/git-workflow.md).
- For anything larger than a small fix, open an issue first so we can agree on the approach. Changes to architecture need an ADR in `docs/architecture/adr/`.
- Be kind. This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Set up

Follow [docs/development/setup.md](./docs/development/setup.md). In short: Node 24, pnpm 11, then `pnpm install` and `pnpm dev`.

## Make a change

1. Branch from `develop`: `feat/<scope>-<topic>`, `fix/<scope>-<topic>`, `docs/<topic>`.
2. Keep the change focused on one concern and match the patterns of the files you touch.
3. Add or update tests and docs alongside the code.
4. Run the checks for every package you changed:

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm format:check
   pnpm test
   pnpm depcruise
   ```

5. Commit with [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat(request-builder): sync query parameters with the url`.
6. Open a pull request into `develop` and fill in the template.

## Pull request checklist

- [ ] CI is green.
- [ ] Tests cover the new behaviour.
- [ ] Keyboard and screen-reader behaviour checked for new interactive UI.
- [ ] Docs updated (and an ADR for hard-to-reverse decisions).
- [ ] No `any`, `console`, `TODO` or unused exports.

## Reporting bugs and security issues

- Bugs and feature ideas: open an issue using the templates.
- Security vulnerabilities: do **not** open a public issue; see [SECURITY.md](./SECURITY.md).
