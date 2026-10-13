import { applyAuth } from "./apply-auth";
import { hasHeader } from "./headers";
import { defaultContentType } from "./serialize-body";
import type { AuthConfig } from "../models/auth.schema";
import type { KeyValueEntry } from "../models/key-value-entry.schema";
import type { RequestBody } from "../models/request-body.schema";

/** Where a generated header comes from. */
export type GeneratedHeaderSource = "body" | "auth";

/** A header API Studio adds on send, shown read-only next to the user's headers (F-05). */
export type GeneratedHeader = {
  name: string;
  value: string;
  source: GeneratedHeaderSource;
  /** Auth headers carry credentials, so the UI masks their value. */
  isSecret: boolean;
};

/** What decides the generated headers: the user's headers, the body and the effective auth. */
export type GeneratedHeaderInput = {
  headers: readonly KeyValueEntry[];
  body: RequestBody;
  /** The auth that applies, `inherit` already resolved (see `resolveInheritedAuth`). */
  auth: AuthConfig;
};

/**
 * The headers added on send that the user did not write: `Content-Type` from the body type and
 * the auth header. A header the user wrote (enabled, same name in any case) always wins, so it
 * is left out here. Values may still contain `{{variables}}`; they are resolved on send.
 */
export function generatedHeaders({ headers, body, auth }: GeneratedHeaderInput): GeneratedHeader[] {
  const written = headers
    .filter((entry) => entry.enabled && entry.key !== "")
    .map((entry) => ({ name: entry.key, value: entry.value }));
  const generated: GeneratedHeader[] = [];

  const contentType = defaultContentType(body);
  if (contentType !== null && !hasHeader(written, "Content-Type")) {
    generated.push({ name: "Content-Type", value: contentType, source: "body", isSecret: false });
  }

  const withAuth = applyAuth({ url: "", headers: written }, auth).headers;
  for (const header of withAuth.slice(written.length)) {
    generated.push({ ...header, source: "auth", isSecret: true });
  }
  return generated;
}
