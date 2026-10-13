# Product Vision

**API Studio is a local-first, keyboard-driven workspace for designing, sending and understanding HTTP requests. It should feel like a code editor: fast, quiet and precise.**

## Vision

Developers spend hours a day talking to APIs. The tools they use are either heavy (account walls, cloud sync by default, slow start) or bare (a text box and a response pane). API Studio sits between them: the depth of a professional tool with the speed and calm of a modern editor.

## Product principles

| # | Principle | What it means in practice |
| --- | --- | --- |
| P1 | **Local-first** | Works with no account and no network to our servers. Data lives on the user's machine; sync is an opt-in layer, never a requirement. |
| P2 | **Keyboard first, mouse friendly** | Every action is reachable from the command palette; frequent actions have shortcuts; nothing *requires* the keyboard. |
| P3 | **Calm by default** | One accent colour, quiet chrome, content first. Motion explains change; it never decorates. |
| P4 | **Fast feels correct** | Instant tab switching, no layout shift, skeletons instead of spinners, optimistic writes. |
| P5 | **Honest data** | Show exactly what was sent and received: resolved URL, final headers, sizes, redirect chain. Never hide a transformation. |
| P6 | **Open formats** | Collections export to a documented, versioned, diff-friendly JSON format. No lock-in. |
| P7 | **Extensible by design** | Built-in features use the same registries a plugin would. Adding GraphQL or a new code generator is an addition, not a rewrite. |

## Goals

| Goal | Measure |
| --- | --- |
| A first request in under 30 seconds from opening the app | Onboarding → sent request, measured in E2E test |
| Feels instant | Tab switch < 50 ms; interaction to next paint < 100 ms; no layout shift on load |
| Trustworthy engine | Request engine (`packages/core`, `packages/runner`) ≥ 90% line coverage; golden tests for every code generator |
| Accessible | WCAG 2.2 AA in both themes; full keyboard operation; axe-clean E2E pages |
| Maintainable | Strict TypeScript, no `any`, module boundaries enforced in CI, every hard decision recorded as an ADR |

## Non-goals (for v1)

- Cloud accounts, team sync and billing.
- Running user scripts (pre-request / test scripts). The architecture leaves room for a sandboxed runtime; see [extensibility.md](../architecture/extensibility.md).
- Being a Postman-compatible clone. We import Postman collections; we do not copy its UI.

## Target users

| Persona | Context | Needs most |
| --- | --- | --- |
| **Backend developer** | Builds and debugs their own APIs, often on `localhost` | Fast send/inspect loop, environments, history, cURL in and out |
| **Frontend developer** | Integrates third-party and internal APIs | Collections, auth helpers, code generation for `fetch` / Axios |
| **QA / API tester** | Explores and verifies endpoints | Saved responses, environments per stage, clear diffs of what was sent |
| **Technical writer / DevRel** | Documents and demos APIs | Clean collections, export, code snippets in many languages |
| **Student / learner** | Learning HTTP | Readable responses, explanations of status codes and headers, no sign-up |

## Identity

- **Name:** API Studio. **Repository:** `api-studio`. **Package scope:** `@api-studio/*`.
- **Voice:** short, precise, friendly. "Request sent in 142 ms", not "Your request has been successfully sent!".
- **Look:** dark-first editor aesthetic, one cool accent, colour reserved for meaning (HTTP methods, status classes). Details in [design-system.md](../design/design-system.md).
