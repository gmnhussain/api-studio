# ADR-0006: Native, versioned collection document

- Status: Accepted
- Date: 2026-10-13

## Context

Users must own their data (principle P6) and be able to keep collections in git. The internal model will evolve.

## Decision

- Export format `api-studio.collection` with an integer `schemaVersion`, defined by a Zod schema; a JSON Schema is generated from it for editors and other tools.
- Flat, `parentId`-linked items, stable key order, 2-space indentation: diff-friendly.
- Pure migrations `vN → vN+1`; import always migrates to the latest version.
- Secret variable values are never exported.
- Postman v2.1, cURL and (later) OpenAPI are importers into this model, not alternative storage formats.

## Alternatives considered

- **Postman format as native:** heavy, loosely specified, and ties our model to another product.
- **One file per request (Bruno style):** excellent for git, but needs file system access; possible later as a desktop/CLI feature on the same model.

## Consequences

- Old exports keep importing forever (tested with a fixture per version).
- Every model change needs a migration and a fixture.
