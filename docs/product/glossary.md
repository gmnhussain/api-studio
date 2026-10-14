# Glossary

One name per concept, used the same way in the UI, the docs and the code. If a word is not here, add it before using it in code.

| Term | Meaning | Code name |
| --- | --- | --- |
| Workspace | Top-level container for collections, environments, history and settings overrides. A user can have several. | `Workspace`, `workspaceId` |
| Collection | A named, exportable tree of folders and requests. | `Collection`, `collectionId` |
| Folder | A grouping node inside a collection. Can hold folders and requests; can define auth and variables inherited by its children. | `FolderItem` |
| Collection item | A folder or a request inside a collection tree. | `CollectionItem` (union of `FolderItem` and `RequestItem`) |
| Request | A saved request definition: protocol, method, URL, parameters, headers, auth, body, settings. | `RequestItem`, `HttpRequestDefinition` |
| Draft | The editable working copy of a request in an open tab. Differs from the saved request until saved. | `RequestDraft` |
| Protocol | The transport a request uses. `http` today; `graphql`, `websocket`, `sse`, `grpc` later. | `Protocol` |
| Method | HTTP method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`. | `HttpMethod` |
| Query parameter | A `key=value` pair in the URL query string, kept in sync with the URL. | `QueryParameter` |
| Path variable | A `:name` segment in the URL path, filled in per request. | `PathVariable` |
| Key-value entry | One row in a headers / params / form table, with an enabled flag. | `KeyValueEntry` |
| Auth | How a request authenticates: none, inherit, basic, bearer, API key, OAuth 2.0. | `AuthConfig` |
| Body | The request payload and its type (JSON, form data, URL-encoded, raw text, XML, binary). | `RequestBody` |
| Environment | A named set of variables for one target (e.g. Local, Staging, Production). One is active per workspace. | `Environment`, `activeEnvironmentId` |
| Variable | A named value referenced as `{{name}}`. Can be secret (masked, excluded from export). | `Variable` |
| Variable scope | Where a variable is defined: global (workspace), collection, environment. Later scopes override earlier ones. | `VariableScope` |
| Resolution | Replacing every `{{name}}` with its value before sending. | `resolveVariables()` |
| Execution | One attempt to send a resolved request and receive a response. Has an id, can be cancelled. | `Execution`, `executionId` |
| Executor | The component that performs an execution (server proxy, direct browser fetch, later desktop or CLI). | `RequestExecutor` |
| Runner | The Node.js HTTP engine behind the proxy executor and the future CLI. | `packages/runner` |
| Response | What came back: status, headers, cookies, body, sizes, timings, redirect chain. | `ResponseSnapshot` |
| Timing | Phases of an execution (time to first byte, download, total). | `ExecutionTimings` |
| Redirect hop | One redirect followed during an execution. | `RedirectHop` |
| Saved response | A response stored on a request as an example. | `SavedResponse` |
| History entry | A record of one execution: the resolved request and a response summary. | `HistoryEntry` |
| Tab | An open editor in the centre area. Shows a request, an environment, or a collection's settings. Can be pinned. | `EditorTab`, `TabKind` |
| Tab layout | The open tabs of a workspace (order, pins, active and recently closed tabs), restored after a reload. | `TabLayout` |
| Pinned tab | A tab that stays at the left and is not closed by "close others". | `isPinned` |
| Console | The bottom panel listing execution logs and app events. | `ConsoleEntry` |
| Command | A named action reachable from the command palette and optionally a shortcut. | `Command`, `commandId` |
| Shortcut | A key binding for a command. | `KeyBinding` |
| Code generator | Turns a resolved request into a code snippet for one target (cURL, `fetch`, Axios, …). | `CodeGenerator`, `CodeTarget` |
| Importer | Turns an external file (Postman, OpenAPI, cURL) into collections. | `CollectionImporter` |
| Collection document | The exported JSON file format of API Studio. Versioned. | `CollectionDocument`, `schemaVersion` |
| Registry | A typed list of contributions (generators, importers, auth schemes, viewers, commands, protocols). Built-ins and future plugins register the same way. | `createRegistry()` |
