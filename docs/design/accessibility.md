# Accessibility

**Target: WCAG 2.2 AA in both themes. A developer tool is used all day; keyboard and screen-reader quality are features, not a checklist.**

## Standards

| Area | Rule |
| --- | --- |
| Contrast | Text ≥ 4.5:1, large text and meaningful UI ≥ 3:1, checked by the token test for every theme and accent preset |
| Colour | Never the only signal: methods have labels, statuses have codes and text, errors have icons and messages |
| Focus | Always visible (`--ring`, 2 px, offset), never removed; focus is never trapped except in modals |
| Keyboard | Every action works without a mouse; drag and drop has keyboard and menu alternatives |
| Targets | Interactive targets ≥ 24 × 24 px (WCAG 2.5.8) |
| Motion | `prefers-reduced-motion` and the in-app setting reduce motion to fades |
| Transparency | `prefers-reduced-transparency` replaces glass with solid surfaces |
| Zoom | Usable at 200% browser zoom; no fixed-height text containers |
| Language | `lang` on `<html>`; plain-language error messages |

## Widget patterns (WAI-ARIA Authoring Practices)

| Widget | Pattern | Notes |
| --- | --- | --- |
| Collection tree | Tree view | Roving `tabindex`, arrows to move / expand / collapse, `Home` / `End`, type-ahead, `aria-level`, `aria-expanded`, `aria-selected` |
| Editor tabs | Tabs | Arrows move focus, `Enter` activates; close buttons reachable; drag alternative via shortcuts |
| Request sections, response views | Tabs | Counts announced ("Headers, 3 items") |
| Key-value tables | Grid | Arrow navigation between cells, `Enter` to edit, `Esc` to leave edit |
| Command palette | Combobox + listbox | `aria-activedescendant`, results count announced |
| Resizable panels | Window splitter | `role="separator"`, arrows resize, `Enter` collapses / restores |
| Menus | Menu / menu button | Context menus also open from the keyboard |
| Toasts | Status / alert regions | Polite for success, assertive for failures; Undo reachable by keyboard |

## Announcements

A single live region service (`announce(message, politeness)`) is used for: request sent / completed with status and time, request failed, item moved (dnd-kit announcements), item deleted (with undo hint), environment switched.

## Testing

- `eslint-plugin-jsx-a11y` in lint.
- Component tests query by role and accessible name (Testing Library), which fails when labels are missing.
- Playwright + `@axe-core/playwright` on every E2E page in both themes; serious and critical violations fail CI.
- A manual pass with NVDA (Windows) and VoiceOver (macOS) at each milestone that adds a new widget.
