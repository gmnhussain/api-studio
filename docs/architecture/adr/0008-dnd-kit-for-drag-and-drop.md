# ADR-0008: dnd-kit for drag and drop

- Status: Accepted
- Date: 2026-10-13

## Context

Drag and drop is needed for the tab strip (horizontal sortable), the collection tree (nested move and reorder) and possibly table rows. It must work with the keyboard and screen readers (WCAG 2.2 requires an alternative to dragging movements).

## Decision

Use **dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`) with keyboard sensors and live-region announcements. Every drag action also has a non-drag alternative (context menu "Move to…", shortcuts).

## Alternatives considered

- **React DnD:** built on the HTML5 drag API, weak keyboard support, little recent maintenance.
- **Pragmatic drag and drop:** fast and small, but accessibility is left to the app.

## Consequences

- One library for tabs and the tree, with accessible defaults.
- Tree drag and drop needs a custom collision strategy for "into folder" versus "between items".
- The tab strip (M3) drags with the pointer sensor only. A keyboard sensor would take Space and Enter, which activate a tab; keyboard users move tabs with `Mod+Shift+←/→` instead, and each move is announced in a live region.
