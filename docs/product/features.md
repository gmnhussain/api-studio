# Features

**Every feature has an id (`F-xx`) used in issues, commits and tests. Priority: MVP ships in v0.1; Advanced ships in v0.2–v0.4; Future is architecture only.**

## MVP — REST client (v0.1)

### Requests

| ID | Feature | Notes |
| --- | --- | --- |
| F-01 | HTTP methods | `GET` `POST` `PUT` `PATCH` `DELETE` `OPTIONS` `HEAD`, colour-coded |
| F-02 | URL bar | Monospace, inline `{{variable}}` highlighting, paste a cURL command to import it (F-46) |
| F-03 | Query parameters | Table kept in two-way sync with the URL |
| F-04 | Path variables | `:id` segments detected from the URL, filled in a table |
| F-05 | Headers | Table with header-name autocomplete and value suggestions; auto-generated headers shown read-only |
| F-06 | Cookies | Per-workspace cookie jar from `Set-Cookie`; manual cookies per request |
| F-07 | Auth | None, inherit (from folder / collection), Basic, Bearer, API key (header or query), OAuth 2.0 (configuration UI only; token flow later) |
| F-08 | Body | JSON, form data (text fields; files later), `x-www-form-urlencoded`, raw text, XML, binary (placeholder) |
| F-09 | Request settings | Timeout, follow redirects, max redirects |
| F-10 | Send / cancel / retry | `Ctrl+Enter` sends; cancel aborts the execution; retry re-sends the last resolved request |

### Responses

| ID | Feature | Notes |
| --- | --- | --- |
| F-11 | Status bar | Status code and text (coloured by class), time, size |
| F-12 | Body views | Pretty (formatted + highlighted), raw, preview |
| F-13 | JSON tree | Collapsible, virtualized, copy path / copy value |
| F-14 | Previews | Image, HTML (sandboxed iframe), Markdown |
| F-15 | Headers and cookies | Tables, searchable |
| F-16 | Copy and download | Copy body; download with a filename from `Content-Disposition` or the URL |
| F-17 | Sizes | Request size and response size (headers + body) |

### Organisation

| ID | Feature | Notes |
| --- | --- | --- |
| F-20 | Workspaces | Create, rename, switch; one is active |
| F-21 | Collections and folders | Tree with drag-and-drop reorder and move |
| F-22 | Item actions | New, rename (inline), duplicate, delete (with undo toast), from a context menu and shortcuts |
| F-23 | Tabs | One tab per open request; drag to reorder; pin; close others / to the right; dirty indicator |
| F-24 | Tab restore | Open tabs and drafts restored after reload |
| F-25 | Auto-save | Drafts persisted continuously; explicit save (`Ctrl+S`) writes to the collection |
| F-26 | History | Every execution recorded; grouped by day; virtualized; open as a new tab |
| F-27 | Environments | Create, edit, switch; active environment in the top bar |
| F-28 | Variables | Global, collection and environment scopes; secret values masked; autocomplete on `{{` |
| F-29 | Search | Filter the sidebar tree; global search across requests, history and environments |
| F-30 | Import / export | Native collection document (versioned JSON) both ways |

### Shell

| ID | Feature | Notes |
| --- | --- | --- |
| F-31 | Layout | Sidebar, tabs + request editor, response panel, console; all resizable and collapsible; sizes remembered |
| F-32 | Command palette | `Ctrl+K`: commands, requests, environments, settings |
| F-33 | Keyboard shortcuts | Central registry, rebindable later, cheat sheet (`Ctrl+/`) |
| F-34 | Themes | Dark (default), light, system |
| F-35 | Console | Execution log with request/response summaries and errors |
| F-36 | Onboarding | First-run flow: create workspace, pick theme, send a sample request |
| F-37 | Settings | Appearance, editor, requests, shortcuts, data (export / reset), about |
| F-38 | Empty states | Every empty list explains itself and offers the next action |

## Advanced (v0.2 – v0.4)

| ID | Feature | Notes |
| --- | --- | --- |
| F-40 | Code generation | cURL, `fetch`, Axios, Python Requests, Node.js (`undici`), PHP (cURL), Go (`net/http`), Java (`HttpClient`) |
| F-41 | Response timeline | Phases (time to first byte, download, total) and events, redirect chain |
| F-42 | Saved responses | Save a response as an example on its request |
| F-43 | Recent requests | Quick list in the palette and on the empty editor |
| F-44 | Postman import | Postman Collection v2.1 |
| F-45 | OpenAPI import | Entry point and file picker only in v0.2; generator later |
| F-46 | cURL import | Paste into the URL bar or import dialog |
| F-47 | Theme presets | Accent presets on top of light / dark |
| F-48 | Request comparison | Diff a draft against the saved request |

## Future (architecture only)

| ID | Feature | Extension point |
| --- | --- | --- |
| F-60 | GraphQL | Protocol adapter + schema-aware editor |
| F-61 | WebSocket | Protocol adapter with a message stream viewer |
| F-62 | Server-Sent Events | Protocol adapter with an event stream viewer |
| F-63 | gRPC | Protocol adapter; runner-only (needs HTTP/2 from Node) |
| F-64 | Mock server | Serve saved responses from the runner |
| F-65 | Tests and scripts | Sandboxed script runtime; assertions on responses |
| F-66 | Collection sync | Repository implementation backed by a sync engine |
| F-67 | Cloud workspace | Remote repository + accounts |
| F-68 | Plugins / extensions | Manifest + the same registries the built-ins use |
| F-69 | CLI | `apps/cli` on `packages/core` + `packages/runner` |
| F-70 | AI assistant | Commands + a context provider (selected request, last response) |
| F-71 | Team collaboration | Workspace membership on top of sync |

How each extension point works: [extensibility.md](../architecture/extensibility.md).
