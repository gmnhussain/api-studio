# Documentation

All repository documentation is in English. Product terms and their code names are in the [glossary](./product/glossary.md).

## Map

| Area | Document | Answers |
| --- | --- | --- |
| Product | [vision.md](./product/vision.md) | What are we building, for whom, and why? |
| | [features.md](./product/features.md) | What is in the MVP, what comes later? (feature ids `F-xx`) |
| | [glossary.md](./product/glossary.md) | What does each term mean, and what is it called in code? |
| Architecture | [overview.md](./architecture/overview.md) | Stack, repository layout, layers, routing, boundaries |
| | [data-model.md](./architecture/data-model.md) | Entities, types, persisted schema, export format |
| | [state-management.md](./architecture/state-management.md) | Stores, services, optimistic updates, hydration |
| | [request-execution.md](./architecture/request-execution.md) | Execution pipeline, executors, proxy, security, codegen, import |
| | [extensibility.md](./architecture/extensibility.md) | Registries, protocols, plugins, sync, CLI |
| | [adr/](./architecture/adr/) | Why were key decisions made? |
| Design | [design-system.md](./design/design-system.md) | Tokens, colour, type, spacing, motion, icons, themes, components |
| | [layout-and-interaction.md](./design/layout-and-interaction.md) | Shell layout, responsive rules, shortcuts, menus, flows |
| | [accessibility.md](./design/accessibility.md) | Standards, widget patterns, testing |
| Development | [conventions.md](./development/conventions.md) | Code standards, naming, definition of done |
| | [testing.md](./development/testing.md) | Test pyramid, coverage, golden tests, CI gates |
| | [performance.md](./development/performance.md) | Budgets and strategies |
| | [git-workflow.md](./development/git-workflow.md) | Branches, releases, commit messages |
| Planning | [milestones.md](./planning/milestones.md) | Milestones, exit criteria, open questions |

## Rules for docs

- A behaviour change and its doc change ship in the same commit or pull request.
- Write the point first. Prefer tables and lists over long prose.
- Unknowns are written as **Open question** blocks, never guessed.
