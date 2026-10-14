# Request Execution

**A request goes through one pipeline, whatever the transport: resolve → plan → execute → normalize → record. Transports are interchangeable `RequestExecutor`s; the default sends through a server-side proxy so the request leaves exactly as the user wrote it.**

## Pipeline

```text
RequestDraft
  │ 1. resolve       core/variables   {{vars}} → values (global → collection → environment); unresolved → error
  │ 2. inherit       core/http        auth "inherit" walks folder → collection
  │ 3. plan          core/execution   build ResolvedRequest: URL + query + path vars, auth applied,
  │                                   body serialized, default headers, cookies from the jar
  │ 4. execute       RequestExecutor  ProxyExecutor (default) | BrowserExecutor
  │ 5. normalize     core/http        parse cookies, classify body (json/html/image/…), sizes
  │ 6. record        app services     history entry, cookie jar update, console entry, tab response
  ▼
ExecutionResult
```

Steps 1–3 and 5 are pure functions in `@api-studio/core`, unit-tested without any network. Step 4 is the only I/O.

## Executor contract

```ts
interface RequestExecutor {
  readonly id: ExecutorId;                 // "proxy" | "browser" | later "desktop" | "cli"
  readonly capabilities: ExecutorCapabilities; // canSetForbiddenHeaders, canReadRedirectChain, bypassesCors…
  execute(request: ResolvedRequest, options: ExecuteOptions): Promise<ExecutionResult>;
}

type ExecuteOptions = { signal: AbortSignal; timeoutMilliseconds: number;
                        followRedirects: boolean; maxRedirects: number };
```

Executors never throw for expected failures; they return `{ outcome: "error", error: { code } }`. The UI explains each `ExecutionError.code` with a specific message and, where useful, an action ("Switch to proxy mode", "Increase timeout").

| Executor | Where | Use | Limits |
| --- | --- | --- | --- |
| `ProxyExecutor` | `apps/web/src/lib/executors/` → `POST /api/v1/executions` → `@api-studio/runner` | Default | Adds one hop; the server must be able to reach the target |
| `BrowserExecutor` | `apps/web/src/lib/executors/` | Hosted demo reaching `localhost`; CORS-enabled APIs | CORS, forbidden headers, no redirect chain, opaque timings |
| `DesktopExecutor` (future) | Desktop shell IPC | Desktop app | — |
| `NodeExecutor` (future) | `apps/cli` using `@api-studio/runner` directly | CLI | — |

The UI reads `capabilities` to disable what an executor can't do (e.g. the redirect chain tab shows "Not available in browser mode").

### Choosing and running an executor

Executors register in the executor registry (`features/execution/lib/executor-registry.ts`); the status bar picks one and the choice is remembered in this browser. The execution service sends with it, falling back to the proxy. Before anything is sent, `planRequest` refuses a request with unresolved variables (`UNRESOLVED_VARIABLES`, listing their names) or an invalid URL or header name (`INVALID_REQUEST`). The proxy executor reports an unreachable or failing proxy as `PROXY_UNAVAILABLE`, and gives up if the proxy has not answered five seconds after the request's own timeout.

## Proxy endpoint

`POST /api/v1/executions` — Node runtime Route Handler, thin:

1. Parse the body with `executionRequestSchema` (Zod). Invalid → `400` problem details (RFC 9457).
2. Call `runner.execute(request, options)` with the request's `AbortSignal` (a client cancel aborts the upstream call).
3. Return `ExecutionResult` as JSON, validated by `executionResultSchema` in the client.

Binary response bodies come back base64-encoded with `truncated` set when the size cap was hit. Large bodies are never parsed on the server.

## Runner (`packages/runner`)

| Responsibility | Approach |
| --- | --- |
| HTTP | `undici` `request` with a per-execution `AbortSignal` combining cancel + timeout |
| Redirects | `redirect: "manual"`; the runner follows up to `maxRedirects` itself and records each `RedirectHop`, applying the method change rules of RFC 9110 (303 → GET; 301/302 POST → GET) |
| Timings | `startedAt`, time to first byte (headers received), download, total. DNS / connect / TLS phases through undici diagnostics channels where available; shown as "unavailable" otherwise, never invented |
| Sizes | Request bytes (start line + headers + body); response header bytes; body bytes as received (before decompression) and decoded |
| Size cap | Stop reading at `MAX_RESPONSE_BYTES` (configurable, default 50 MB) and mark `truncated` |
| Errors | Map undici / system errors to `ExecutionError` codes |

## Security

A proxy that fetches arbitrary URLs is a server-side request forgery (SSRF) risk once deployed publicly. Defaults depend on where it runs:

| Control | Local (`pnpm dev`, self-hosted) | Hosted demo |
| --- | --- | --- |
| Private / loopback / link-local addresses (`127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`, `fc00::/7`, cloud metadata `169.254.169.254`) | Allowed — testing `localhost` APIs is the main use case | **Blocked**; resolved IPs checked after DNS and on every redirect hop (defeats DNS rebinding) |
| Ports | Any | 80, 443, 8000–9999 |
| Rate limit | None | Per-IP token bucket |
| Request / response size | 50 MB cap | 10 MB cap |
| Timeout ceiling | User setting | 30 s maximum |

Configured by `PROXY_ALLOW_PRIVATE_NETWORKS`, `PROXY_ALLOWED_PORTS`, `PROXY_MAX_RESPONSE_BYTES`, `PROXY_MAX_REQUEST_BYTES` and `PROXY_MAX_TIMEOUT_MS`, validated at startup by `instrumentation.ts` (`config/server-env.ts`). In the hosted demo, the UI suggests browser mode for `localhost` targets.

Other rules:

- The proxy never logs request bodies, headers or URLs with query strings.
- HTML previews render in an `iframe` with `sandbox=""` (no scripts, no same-origin) and a strict CSP.
- Secret variables are redacted in history (`••••`) and emptied in exports.
- No credentials are ever stored server-side; the proxy is stateless.

## Cancel, timeout, retry

| Action | Behaviour |
| --- | --- |
| Cancel (`Esc` while sending, or the button) | Aborts the client fetch → the Route Handler's signal → the upstream request. Result `ABORTED`, logged, not added to history as a failure |
| Timeout | Per request (`settings.timeoutMilliseconds`), defaulting from settings; result `TIMEOUT` |
| Retry | Re-executes the last `ResolvedRequest` of the tab (not re-resolved, so it is the exact same request) |
| Concurrency | One in-flight execution per tab; sending again cancels the previous one |

## Code generation

```ts
interface CodeGenerator {
  readonly target: CodeTarget;           // "curl" | "fetch" | "axios" | "python_requests" | "node_undici" | "php_curl" | "go_net_http" | "java_http_client"
  readonly label: string;
  readonly language: EditorLanguage;     // for highlighting
  generate(request: ResolvedRequest, options: CodeGenerationOptions): string;
}
```

Pure, one file per target in `core/code-generation/targets/`, registered in the code generator registry. Each target has golden-file tests covering every body type and auth scheme, and an escaping test (quotes, newlines, unicode). Snippets can be generated with variables resolved or kept as `{{placeholders}}`.

## Import and export

```ts
interface CollectionImporter {
  readonly id: ImporterId;              // "api_studio" | "postman_v2_1" | "curl" | "openapi_3"
  readonly label: string;
  detect(input: string): boolean;       // sniff the format for drag-and-drop import
  import(input: string): Result<ImportOutcome, ImportError>;  // collections + warnings for unsupported parts
}
```

Every importer returns warnings for what it could not map (e.g. Postman scripts) so the user sees exactly what was lost. Export always writes the native [collection document](./data-model.md#collection-document-export-format).
