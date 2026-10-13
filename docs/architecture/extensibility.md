# Extensibility

**Every extension point is a typed registry. Built-in features register into the same registries a plugin would, so the extension API is exercised by our own code from day one (open–closed: add, don't modify).**

## Registries

```ts
interface Registry<TContribution extends { id: string }> {
  register(contribution: TContribution): Disposable;
  get(id: TContribution["id"]): TContribution | undefined;
  list(): readonly TContribution[];
}
```

`createRegistry()` lives in `@api-studio/core/registry`. Registrations happen in one place per feature (`<feature>.contributions.ts`), loaded at startup.

| Registry | Contribution | Built-ins in v1 |
| --- | --- | --- |
| Protocols | `ProtocolAdapter` | `http` |
| Auth schemes | `AuthScheme` (schema, form component, `apply()`) | none, inherit, basic, bearer, API key, OAuth 2.0 (config only) |
| Body types | `BodyType` (schema, editor component, `serialize()`) | JSON, text, XML, form data, URL-encoded, binary |
| Code generators | `CodeGenerator` | 8 targets |
| Importers | `CollectionImporter` | native, Postman v2.1, cURL, OpenAPI (entry only) |
| Response viewers | `ResponseViewer` (`canView(response)`, component, priority) | pretty, raw, JSON tree, image, HTML, Markdown |
| Commands | `Command` (id, title, icon, `when`, `run`, default key binding) | every palette action |
| Sidebar sections | `SidebarSection` | collections, history, environments, variables |
| Executors | `RequestExecutor` | proxy, browser |

Framework-free contributions (generators, importers, auth `apply`) live in core; contributions with React components live in the owning web feature.

## Protocol adapters (GraphQL, WebSocket, SSE, gRPC)

```ts
interface ProtocolAdapter<TDefinition extends RequestDefinition> {
  readonly protocol: TDefinition["protocol"];
  readonly label: string;
  readonly schema: z.ZodType<TDefinition>;
  createDefault(): TDefinition;
  resolve(definition: TDefinition, variables: VariableMap): Result<ResolvedProtocolRequest, ResolutionError>;
  // Request/response protocols return one result; streaming protocols return a session.
  readonly interaction: "request_response" | "stream";
}
```

| Protocol | Interaction | What is added |
| --- | --- | --- |
| GraphQL | request/response over HTTP | Definition (query, variables, operation name), schema introspection, GraphQL editor language; reuses the HTTP executor |
| WebSocket | stream | `StreamSession` executor contract (connect, send, messages, close), message timeline viewer |
| SSE | stream | Same `StreamSession` contract, event list viewer |
| gRPC | request/response + stream | Runner-only executor (needs HTTP/2 and proto loading in Node) |

The request editor picks its sections from the adapter; tabs, collections, history and environments are protocol-agnostic and need no change.

## Plugins

1. **Manifest** (`api-studio.plugin.json`): id, version, engine range, requested contribution points, permissions.
2. **Sandbox:** third-party code runs in a Web Worker (or an iframe for UI) and talks to the host over a typed message channel; no direct store or DOM access.
3. **Host API:** a versioned facade over the registries plus read-only access to the active request and response.

Not built in v1; the registries and command system are the groundwork.

## Sync, cloud workspace, collaboration

All data access goes through repository interfaces (`CollectionRepository`, …). v1 ships `IndexedDb*Repository`. Sync adds a `Synced*Repository` that writes locally first and pushes changes to a remote; ids are UUID v7 and records carry `updatedAt`, so they merge without central id allocation. Collaboration (presence, shared workspaces) layers on top of sync. Stores and components do not change.

## CLI

`apps/cli` = `@api-studio/core` (load a collection document, resolve variables, generate code) + `@api-studio/runner` (execute). Runs collections in CI and prints a report. Possible because neither package depends on React or the browser.

## Mock server

The runner gains a small HTTP server that matches incoming requests to saved responses by method + path pattern. Uses existing models; no new storage.

## Tests and scripts

Pre-request and test scripts run in an isolated runtime (QuickJS compiled to WebAssembly, in a Worker) with a narrow API (`request`, `response`, `environment`, `expect`). Never `eval` or `new Function` in the app context. Results attach to the execution as `TestResult[]`.

## AI assistant

A command contribution plus a context provider exposing the selected request, the last response and the active environment (secrets excluded). Typical actions: explain a response, generate a request from a description, write tests. The model provider sits behind an interface, and API keys stay with the user.
