# Design System

**Quiet surfaces, one cool accent, colour reserved for meaning. Dark first, light equal. Every value is a token; components never use raw colours, sizes or durations.**

## Design principles

| # | Principle | Rule of thumb |
| --- | --- | --- |
| D1 | Content over chrome | Borders and spacing separate regions; backgrounds stay within 3 close steps |
| D2 | Colour means something | Accent = interactive / focus; method and status colours = HTTP meaning; nothing else is coloured |
| D3 | Density with air | Compact controls (32 px), generous gaps between groups (24 px) |
| D4 | Motion explains | Animate what changed and where it went; 200 ms or less for most transitions |
| D5 | Monospace for machine text | URLs, headers, bodies, sizes and times use the mono font with tabular figures |
| D6 | Every state is designed | Empty, loading, error, offline, overflow, long text, 0 and 10,000 items |

## Colour

Tokens are OKLCH CSS variables in `apps/web/src/styles/tokens.css`, mapped to Tailwind utilities with `@theme inline` (`bg-surface`, `text-muted-foreground`, `text-method-post`). Contrast is checked by `src/styles/tokens.test.ts` for both themes and every accent preset: text tokens ≥ 4.5:1 on every surface they're used on (including status text on its own tint and method labels on the selected row), focus rings and hints ≥ 3:1. Values in this table are kept in step with `tokens.css`.

### Neutrals and surfaces

A cool, slightly blue-tinted neutral ramp (hue 265). The steps get lighter in dark mode and darker in light mode, so a "raised" surface always reads as closer to the user.

| Token | Use | Dark | Light |
| --- | --- | --- | --- |
| `--background` | App background, editor canvas | `oklch(0.145 0.006 265)` | `oklch(0.99 0.002 265)` |
| `--surface` | Sidebar, panels, tab strip | `oklch(0.175 0.006 265)` | `oklch(0.975 0.003 265)` |
| `--surface-raised` | Popovers, menus, dialogs, palette | `oklch(0.205 0.007 265)` | `oklch(1 0 0)` |
| `--surface-hover` | Row and item hover | `oklch(0.235 0.008 265)` | `oklch(0.955 0.004 265)` |
| `--surface-selected` | Selected row, active tab | `oklch(0.26 0.012 255)` | `oklch(0.94 0.012 245)` |
| `--border` | Dividers, inputs | `oklch(0.27 0.008 265)` | `oklch(0.91 0.005 265)` |
| `--border-strong` | Focused inputs, emphasised dividers | `oklch(0.36 0.01 265)` | `oklch(0.84 0.008 265)` |
| `--foreground` | Primary text | `oklch(0.96 0.003 265)` | `oklch(0.2 0.01 265)` |
| `--muted-foreground` | Secondary text, labels | `oklch(0.71 0.01 265)` | `oklch(0.47 0.012 265)` |
| `--subtle-foreground` | Placeholders, disabled, hints | `oklch(0.56 0.012 265)` | `oklch(0.6 0.01 265)` |

### Accent: "Ion"

A clear, electric blue that reads as precise and technical, distinct from the orange, purple and green other API tools use.

| Token | Dark | Light |
| --- | --- | --- |
| `--primary` | `oklch(0.72 0.15 237)` | `oklch(0.5 0.17 245)` |
| `--primary-foreground` | `oklch(0.17 0.03 245)` | `oklch(0.99 0.005 245)` |
| `--primary-muted` (tinted backgrounds) | `oklch(0.72 0.15 237 / 14%)` | `oklch(0.5 0.17 245 / 10%)` |
| `--ring` (opaque, so focus rings meet 3:1) | `oklch(0.72 0.15 237)` | `oklch(0.5 0.17 245)` |

Accent presets (setting F-47) override only these four tokens: **Ion** (default), **Iris** (violet, hue 285), **Ember** (orange, hue 50), **Moss** (green, hue 150), **Graphite** (neutral, no hue).

### Semantic

| Token | Meaning | Dark | Light |
| --- | --- | --- | --- |
| `--success` | 2xx, saved, connected | `oklch(0.74 0.16 155)` | `oklch(0.48 0.15 155)` |
| `--warning` | 4xx, unresolved variable, dirty | `oklch(0.81 0.15 80)` | `oklch(0.5 0.13 65)` |
| `--danger` | 5xx, errors, destructive actions | `oklch(0.68 0.2 25)` | `oklch(0.52 0.21 25)` |
| `--info` | 1xx / 3xx, notices | `oklch(0.74 0.12 230)` | `oklch(0.49 0.13 235)` |

Each has a `-muted` variant (same colour at 12–14% alpha) for badges and backgrounds.

### HTTP methods

Methods are always shown as short monospace labels, never colour alone.

| Method | Token | Hue | Label |
| --- | --- | --- | --- |
| GET | `--method-get` | green 155 | `GET` |
| POST | `--method-post` | amber 75 | `POST` |
| PUT | `--method-put` | blue 245 | `PUT` |
| PATCH | `--method-patch` | violet 295 | `PATCH` |
| DELETE | `--method-delete` | red 25 | `DEL` |
| OPTIONS | `--method-options` | teal 195 | `OPT` |
| HEAD | `--method-head` | neutral | `HEAD` |

Lightness and chroma match the semantic tokens of the same theme, so methods read equally in dark and light.

## Typography

| Role | Font | Loaded with |
| --- | --- | --- |
| UI | **Geist Sans** (variable) | `next/font`, `display: swap`, subset latin |
| Code, URLs, data | **Geist Mono** (variable) | `next/font`; also passed to Monaco |

Scale (UI default is 13 px, like desktop editors):

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `text-2xs` | 11 / 16 | 500 | Badges, method labels in the tree, keyboard hints |
| `text-xs` | 12 / 16 | 400–500 | Table headers, captions, status bar |
| `text-sm` | 13 / 20 | 400 | **Default UI text**, inputs, menus |
| `text-base` | 14 / 22 | 400 | Body copy in settings and dialogs |
| `text-lg` | 16 / 24 | 600 | Panel and dialog titles |
| `text-xl` | 20 / 28 | 600 | Settings section titles |
| `text-2xl` | 24 / 32 | 600 | Empty-state and onboarding headings |
| `text-3xl` | 32 / 40 | 600 | Onboarding hero |

Rules: tracking `-0.01em` at 20 px and above; `tabular-nums` for times, sizes, status codes and counts; at most two weights in one component; sentence case everywhere (no Title Case, no ALL CAPS except method labels).

## Spacing, sizing and shape

4 px base unit (Tailwind default scale).

| Token / rule | Value |
| --- | --- |
| Control heights | `sm` 28 px, `md` 32 px (default), `lg` 40 px (onboarding, dialogs' primary actions) |
| Inline gap (icon ↔ label) | 6–8 px |
| Panel padding | 12 px (dense panels), 16 px (dialogs, settings cards) |
| Group gap | 24 px; settings sections 40 px |
| Tab strip / top bar / status bar | 36 px / 44 px / 24 px |
| Sidebar | Icon rail 48 px; panel default 280 px, min 220, max 480 |
| Radius | `--radius-sm` 6 px (badges, small controls), `--radius-md` 8 px (inputs, buttons), `--radius-lg` 12 px (cards, popovers), `--radius-xl` 16 px (dialogs, palette) |
| Readable width | Settings and onboarding content max 720 px |

## Elevation and glass

| Level | Treatment | Used by |
| --- | --- | --- |
| 0 | `--background`, no border | Editor canvas |
| 1 | `--surface` + 1 px `--border` | Sidebar, panels |
| 2 | `--surface-raised` + border + `--shadow-popover` | Menus, popovers, tooltips |
| 3 | Glass: `--surface-raised` at 80% + `backdrop-blur-xl` + 1 px inner highlight + `--shadow-overlay` | Command palette, dialogs, toasts |

Glass is only for floating layers above content, never for static panels. With `prefers-reduced-transparency` it falls back to solid level 2.

Z-index scale lives in `constants/z-index.ts`: base 0, sticky 10, dropdown 40, overlay 50, modal 60, toast 70, tooltip 80.

## Motion

Motion (`motion/react`) for layout and presence, CSS transitions for hover and focus.

| Token | Value | Use |
| --- | --- | --- |
| `duration-instant` | 80 ms | Hover, press |
| `duration-fast` | 150 ms | Tooltips, menus, tab activation |
| `duration-base` | 200 ms | Panels, accordions, response arrival |
| `duration-slow` | 300 ms | Dialogs, palette, onboarding steps |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entering |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Moving |
| Spring (layout) | stiffness 500, damping 40 | Tab reorder, tree drop, active indicators |

Signature micro-interactions: the active tab and section indicators slide (shared `layoutId`); the send button turns into a cancel button with a progress hairline; a response fades up 4 px; the status badge pops once; rows enter with a 20 ms stagger (max 8 items). With reduced motion, everything becomes an opacity fade of `duration-fast` or less.

Durations and easings are constants in `constants/motion.ts`, shared by CSS and Motion.

## Icons

- **Lucide** only. Default 16 px, 14 px in dense rows, 20 px in empty states; `stroke-width: 1.75`; colour from `currentColor`.
- Domain concepts map to one icon each in `config/icons.ts` (collection, folder, environment, history, variable, …), so a concept never appears with two icons.
- Icon-only buttons always have an `aria-label` and a tooltip with the shortcut.
- Empty-state illustrations are bespoke inline SVG components in `components/illustrations/`, drawn with tokens (two tones + accent), so they theme automatically. No raster images or stock art.

## Theme architecture

1. The appearance settings (theme `dark | light | system`, accent, density, motion) persist in a cookie. An inline boot script in `<head>` applies them to `<html>` (`class="dark"`, `data-accent`, `data-density`, `data-motion`) before the first paint, so there is no flash ([ADR-0011](../architecture/adr/0011-cookie-backed-preferences-and-layout.md)). Default: dark.
2. `tokens.css` defines light values on `:root` and dark values on `.dark`; `data-accent="ion|iris|ember|moss|graphite"` swaps the accent tokens; `data-density="compact"` tightens control heights and paddings.
3. `globals.css` maps tokens into Tailwind with `@theme inline`; components use utilities only.
4. Monaco themes are generated from the same tokens on theme change (`defineTheme`), so editor and app never drift.
5. Syntax highlighting colours are tokens too (`--syntax-key`, `--syntax-string`, `--syntax-number`, `--syntax-keyword`, `--syntax-comment`), used by Monaco and the JSON tree.

## Component library

### Primitives — `components/ui/` (shadcn/ui, added by CLI, then themed)

Button, Input, Textarea, Label, Select, Checkbox, Switch, Toggle Group, Tabs, Tooltip, Popover, Hover Card, Dropdown Menu, Context Menu, Dialog, Alert Dialog, Sheet, Command, Resizable, Scroll Area, Separator, Skeleton, Badge, Kbd, Sonner (toasts), Collapsible.

### Shared composites — `components/common/`

| Component | Purpose |
| --- | --- |
| `CodeEditor` | Lazy Monaco wrapper: language, read-only, themed, format action, skeleton while loading |
| `KeyValueTable` | Editable rows (enabled, key, value, description), bulk-edit mode, keyboard row navigation; base of headers / params / form tables |
| `VariableInput` | Single-line input with `{{variable}}` highlighting, hover value preview and `{{` autocomplete |
| `Panel` / `PanelHeader` | Region container with title, toolbar slot, collapse control |
| `EmptyState` | Illustration, title, description, primary and secondary action |
| `LoadingOverlay` | Non-blocking overlay with progress for a busy region |
| `ShortcutHint` | Renders a key binding with platform-aware symbols (⌘ / Ctrl) |
| `CopyButton` | Copy with confirmation micro-interaction |
| `InlineRename` | Label that turns into an input (F2 / double-click), commits on Enter, cancels on Esc |
| `ConfirmDialog` | Destructive confirmation naming the item |
| `SearchInput` | Input with icon, clear button and shortcut hint (with sidebar search, M6) |
| `VirtualList` | TanStack Virtual wrapper with keyboard navigation |
| `SegmentedControl` | Compact exclusive switch (Pretty / Raw / Preview) |
| `AppLogo` | The product mark, drawn in the accent colour |
| `ErrorView` | Full-height failure message with a retry, for route error boundaries |

### Feature components (owned by their feature)

| Component | Feature |
| --- | --- |
| `AppShell`, `TopBar`, `ActivityRail`, `Workbench`, `SidebarContent`, `SidebarSheet`, `PanelToggleButton`, `EditorWelcome`, `StatusBar` | `shell` |
| `WorkspaceSwitcher` | `workspace` |
| `CollectionTree`, `CollectionTreeItem` | `collections` |
| `EditorTabs`, `EditorTab` | `tabs` |
| `RequestMethodSelect`, `RequestUrlBar`, `RequestSections`, `HeaderTable`, `AuthEditor`, `BodyEditor` | `request-builder` |
| `ResponseViewer`, `ResponseStatusBar`, `JsonTree`, `ResponseTimeline`, `ResponsePreview` | `response-viewer` |
| `EnvironmentSelector`, `EnvironmentEditor` | `environments` |
| `HistoryList` | `history` |
| `ConsolePanel` | `console` (empty state lives in `shell` until M4) |
| `CommandPalette` (search command) | `command-palette` |
| `CodeSnippetDialog` | `code-generation` |
| `ImportDialog` | `import-export` |
| `ThemeSwitcher`, `SettingsNavigation`, `AppearanceSettings`, `AboutSettings` | `settings` (the switcher changes a setting, so it lives with the feature, not in shared code) |
| `OnboardingFlow` | `onboarding` |

Every exported component has a TSDoc block (purpose, notable props, accessibility notes); complex ones (tree, tables, editor, tabs) also explain their interaction model at the top of the file.

## Patterns

| Pattern | Rule |
| --- | --- |
| Empty states | Say what goes here, why it's useful, and offer one primary action plus a shortcut hint |
| Loading | Skeletons shaped like the content; no spinners for under 300 ms; never block the whole app |
| Errors | Inline, specific, with a recovery action; toasts only for background results |
| Destructive actions | Undo toast for reversible ones (delete request); confirm dialog naming the item for irreversible ones (reset all data) |
| Truncation | Middle-truncate URLs, end-truncate names; full value in a tooltip |
| Numbers | `142 ms`, `1.2 s`, `3.4 KB`, `1.1 MB` — one formatter in core |
| Dates | Relative for recent ("2 min ago"), absolute on hover; history grouped Today / Yesterday / date |
| Writing | Sentence case, verbs on buttons ("Send", "Save request"), no exclamation marks |
