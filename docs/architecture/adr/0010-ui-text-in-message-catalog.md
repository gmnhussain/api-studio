# ADR-0010: UI text in a message catalog (next-intl)

- Status: Accepted
- Date: 2026-10-13

## Context

API Studio is meant to become an open-source product, which usually means community translations later. Retrofitting a message catalog touches every component, while starting with one costs little. Hard-coded strings also scatter product voice and make copy reviews hard.

## Decision

- All user-facing text goes through **next-intl** from day one, with English (`en`) as the only locale for now.
- No locale in the URL: the locale is fixed in `src/i18n/request.ts` until a second language exists. Adding locale routing later is a configuration change, not a component change.
- Messages live in `src/i18n/messages/en.json`, grouped by feature (`shell`, `settings`, …). Keys are typed through next-intl's `AppConfig`, so a missing or misspelled key fails `typecheck`.
- Numbers, sizes, durations and dates are formatted through next-intl's formatters or core formatters, never by string concatenation.

## Alternatives considered

- **Hard-coded English until a translation is requested:** fastest now, but the later migration touches every component and every test.
- **i18next / react-i18next:** mature, but next-intl integrates natively with the App Router (Server Components, static rendering) and has typed keys.

## Consequences

- Every component uses `useTranslations` / `getTranslations`; tests render inside a test provider.
- Copy can be reviewed in one file.
- A second language needs only a messages file and, if wanted, locale routing.
