# ADR-0003: Execute requests through a server-side proxy by default

- Status: Accepted
- Date: 2026-10-13

## Context

A browser `fetch` is limited by CORS, cannot set forbidden headers (`Cookie`, `Host`, `Origin`, …), hides redirect chains and gives opaque timings. An API client that cannot send what the user wrote is not trustworthy (principle P5).

## Decision

- Execution goes through the `RequestExecutor` interface.
- Default `ProxyExecutor`: the client posts the resolved request to `POST /api/v1/executions`; a Route Handler validates it and calls `@api-studio/runner` (undici), which handles redirects, timeouts, size caps and timings.
- `BrowserExecutor` as an opt-in for the hosted demo reaching `localhost` and for CORS-enabled APIs.
- SSRF protection is configuration-driven: private networks allowed locally, blocked when hosted (checked after DNS resolution and on every redirect hop).

## Alternatives considered

- **Browser-only:** zero infrastructure, but breaks on most real APIs (CORS) and cannot show redirects or set cookies.
- **Browser extension as transport:** bypasses CORS, but users must install something before their first request.
- **Separate proxy service:** more moving parts; a Route Handler is enough and deploys with the app.

## Consequences

- Requests behave as they would from `curl`.
- Hosting publicly needs the SSRF guard, rate limiting and size caps from day one.
- A desktop or CLI executor slots in behind the same interface later.
