# Layout and Interaction

**An editor layout: activity rail, sidebar, tabbed editor, response panel and console, every region resizable and collapsible, every action reachable by keyboard.**

## Shell

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ TopBar  [Workspace ▾]        [ Search or run a command…  Ctrl K ]   [Env: Local ▾] [◐] │
├────┬───────────────┬──────────────────────────────────────┬───────────────────────┤
│ ▣  │ COLLECTIONS ＋ │ [GET Users ×][POST Login ●][📌 Health]│ 200 OK · 142 ms · 3.4 KB│
│ ⏱  │ ▾ Acme API    │ ┌GET▾┐ {{baseUrl}}/users/:id   [Send ▾]│ Body Headers Cookies   │
│ ◫  │   ▸ Auth      │ Params Auth Headers(3) Body Cookies … │ Timeline               │
│ {} │   GET Users   │                                       │ ┌───────────────────┐ │
│    │   POST Login  │   KeyValueTable / BodyEditor / …      │ │ { "id": 1, … }     │ │
│    │               │                                       │ └───────────────────┘ │
│ ⚙  │               ├───────────────────────────────────────┴───────────────────────┤
│    │               │ Console  ▸ GET https://api.acme.dev/users/1 → 200 (142 ms)       │
├────┴───────────────┴───────────────────────────────────────────────────────────────┤
│ StatusBar  ● Proxy · Local · Last: 200 in 142 ms                     v0.1.0 · Ln 4  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

| Region | Behaviour |
| --- | --- |
| **Activity rail** (48 px) | Sections: Collections, History, Environments, Variables; Settings at the bottom. Active section has a sliding indicator. Clicking the active section collapses the sidebar |
| **Sidebar panel** | Resizable (220–480 px), collapsible (`Mod+B`); header with section title, search and "new" action |
| **Top bar** | Workspace switcher, command palette trigger, environment selector, theme switcher |
| **Tab strip** | Sortable (drag or `Mod+Shift+←/→`), pinned tabs first and icon-sized, dirty dot, middle-click closes, overflow scrolls with fade edges and a "all tabs" menu |
| **Request editor** | URL row (method, URL, send split-button) + section tabs with counts + section content |
| **Response panel** | Resizable split with the editor; orientation side-by-side or stacked (setting, and automatic below 1280 px); collapsible (`Mod+Alt+R`) |
| **Console** | Bottom panel, resizable, collapsible (`Mod+J`); filter by level; click an entry to reveal its history item |
| **Status bar** | Executor mode, active environment, last execution summary, app version |

Panel sizes and collapsed states persist per workspace (UI store).

## Responsive

| Width | Layout |
| --- | --- |
| ≥ 1280 px | Full layout, response side by side |
| 1024–1279 px | Response stacks under the editor |
| 768–1023 px | Sidebar becomes an overlay sheet; rail stays |
| < 768 px | Single column: rail becomes a bottom bar; a segmented control switches Request / Response; console in a sheet. Usable, not the primary target |

## Keyboard shortcuts

`Mod` is `⌘` on macOS and `Ctrl` elsewhere. Browsers reserve some keys (`Mod+W`, `Mod+N`, `Mod+T`, `Mod+Shift+T`, `Ctrl+Tab`, `Mod+1…9`), so tab commands use `Alt`; DevTools keys (`Mod+Shift+C`, `Mod+Shift+I`) are avoided too. Bindings are verified in Chromium, Firefox and WebKit by E2E tests. A future desktop shell can map the native keys through the same registry.

| Action | Shortcut |
| --- | --- |
| Command palette | `Mod+K` |
| Quick open request | `Mod+P` |
| Send request | `Mod+Enter` |
| Cancel request | `Esc` (while sending) |
| Save request | `Mod+S` |
| New request tab | `Alt+N` |
| Close tab / reopen closed tab | `Alt+W` / `Alt+Shift+T` |
| Next / previous tab | `Alt+]` / `Alt+[` |
| Go to tab 1–9 | `Alt+1` … `Alt+9` |
| Move tab left / right | `Mod+Shift+←` / `Mod+Shift+→` |
| Focus URL bar | `Mod+L` |
| Switch environment | `Mod+E` |
| Toggle sidebar / console / response | `Mod+B` / `Mod+J` / `Mod+Alt+R` |
| Rename / duplicate / delete item | `F2` / `Mod+D` / `Delete` |
| Format body | `Shift+Alt+F` |
| Copy as cURL | `Mod+Alt+C` |
| Settings | `Mod+,` |
| Shortcut cheat sheet | `Mod+/` |

All bindings live in one keymap (`config/keymap.ts`) bound to command ids; the palette, menus, tooltips and the cheat sheet all read from it, so a shortcut is defined once. Shortcuts are scoped (`global`, `editor`, `tree`, `table`) and don't fire while an IME is composing.

## Context menus

Right-click (or `Shift+F10` / the menu key) on:

| Target | Actions |
| --- | --- |
| Collection | New request, New folder, Rename, Duplicate, Export, Settings, Delete |
| Folder | New request, New folder, Rename, Duplicate, Move to…, Delete |
| Request | Open, Open in new tab, Rename, Duplicate, Copy as cURL, Generate code, Move to…, Delete |
| Tab | Pin / Unpin, Close, Close others, Close to the right, Close saved, Reveal in sidebar |
| History entry | Open in tab, Save to collection, Copy as cURL, Delete |
| Response body | Copy, Copy JSON path (tree), Save response, Download |

Each item shows its shortcut; menu content comes from the command registry.

## Command palette

`Mod+K` opens a glass overlay with grouped results: **Commands**, **Requests**, **Environments**, **Recent**, **Settings**. Prefixes narrow the scope: `>` commands, `#` environments, `@` history. Fuzzy-matched (core `search`), with matched characters highlighted. `Enter` runs, `Mod+Enter` opens in a new tab, `Esc` closes. Recent picks rank first.

## Key flows

1. **First run:** onboarding (welcome → name workspace → theme → sample request) → studio with the sample request open and its response shown.
2. **Send:** focus URL (`Mod+L`) → type or paste (a pasted cURL becomes a full request) → `Mod+Enter` → response arrives with status, time and size; history and console update.
3. **Organise:** "Save" on an unsaved tab opens a small dialog to pick collection and folder; drag in the tree to move; `F2` to rename.
4. **Switch stage:** `Mod+E` → pick environment → variables re-resolve; unresolved ones are highlighted.
5. **Share:** context menu → Export collection → JSON file; or Generate code → pick target → copy.
