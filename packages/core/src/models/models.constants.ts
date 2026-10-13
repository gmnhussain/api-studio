/** Longest name a workspace, collection, folder, request or environment may have. */
export const NAME_MAX_LENGTH = 120;

/** Request settings defaults and limits (data-model.md#requests-protocol-extensible). */
export const DEFAULT_TIMEOUT_MILLISECONDS = 30_000;
export const MAX_TIMEOUT_MILLISECONDS = 600_000;
export const DEFAULT_MAX_REDIRECTS = 10;
export const MAX_REDIRECTS_LIMIT = 50;

/** Where an API key is sent. */
export const API_KEY_PLACEMENTS = ["header", "query"] as const;

/** OAuth 2.0 grant types the configuration form offers; the token flow arrives later. */
export const OAUTH2_GRANT_TYPES = ["authorization_code", "client_credentials", "password"] as const;

/** Colour tags an environment can carry, mapped to semantic tokens in the UI. */
export const ENVIRONMENT_COLORS = ["neutral", "green", "amber", "red", "blue", "violet"] as const;

/** Body types (F-08). */
export const BODY_TYPES = [
  "none",
  "json",
  "text",
  "xml",
  "form_data",
  "url_encoded",
  "binary",
] as const;

/** Auth schemes (F-07). */
export const AUTH_TYPES = ["none", "inherit", "basic", "bearer", "api_key", "oauth2"] as const;

/** What an editor tab shows (glossary: Tab). */
export const TAB_KINDS = ["request", "environment", "collection"] as const;

/** How many closed tabs "reopen closed tab" remembers per workspace. */
export const RECENTLY_CLOSED_TABS_LIMIT = 20;
