import "server-only";

import * as z from "zod/mini";

const MEGABYTE = 1024 * 1024;

/** Defaults for local use (request-execution.md#security); a public deployment tightens them. */
const DEFAULT_MAX_BODY_BYTES = 50 * MEGABYTE;
const DEFAULT_MAX_TIMEOUT_MILLISECONDS = 600_000;
const MAX_PORT = 65_535;

const BOOLEAN_PATTERN = /^(true|false)$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const PORT_LIST_PATTERN = /^\d+(\s*,\s*\d+)*$/;

/** The variables as text, each checked for its format; empty means unset. */
const rawServerEnvSchema = z.object({
  /** Let the proxy reach `localhost` and private networks: on locally, off for a public demo. */
  PROXY_ALLOW_PRIVATE_NETWORKS: z.optional(z.string().check(z.regex(BOOLEAN_PATTERN))),
  /** Ports the proxy may reach, comma-separated; unset allows any. */
  PROXY_ALLOWED_PORTS: z.optional(z.string().check(z.regex(PORT_LIST_PATTERN))),
  PROXY_MAX_RESPONSE_BYTES: z.optional(z.string().check(z.regex(POSITIVE_INTEGER_PATTERN))),
  PROXY_MAX_REQUEST_BYTES: z.optional(z.string().check(z.regex(POSITIVE_INTEGER_PATTERN))),
  PROXY_MAX_TIMEOUT_MS: z.optional(z.string().check(z.regex(POSITIVE_INTEGER_PATTERN))),
});

/** The server's configuration (overview.md#cross-cutting). */
export type ServerEnv = {
  proxyAllowPrivateNetworks: boolean;
  /** `null` allows any port. */
  proxyAllowedPorts: readonly number[] | null;
  proxyMaxResponseBytes: number;
  proxyMaxRequestBytes: number;
  proxyMaxTimeoutMilliseconds: number;
};

let serverEnv: ServerEnv | undefined;

function parsePorts(text: string): number[] {
  const ports = text.split(",").map((port) => Number(port.trim()));
  const invalid = ports.find((port) => port < 1 || port > MAX_PORT);
  if (invalid !== undefined)
    throw new Error(`PROXY_ALLOWED_PORTS: ${String(invalid)} is not a port`);
  return ports;
}

/**
 * The validated server configuration. Invalid values fail loudly, and `instrumentation.ts` reads
 * this at startup, so a misconfigured server never starts.
 *
 * @throws {Error} Listing every invalid variable.
 */
export function getServerEnv(): ServerEnv {
  if (serverEnv) return serverEnv;
  const result = rawServerEnvSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(`Invalid server configuration:\n${problems.join("\n")}`);
  }
  const raw = result.data;
  serverEnv = {
    proxyAllowPrivateNetworks: raw.PROXY_ALLOW_PRIVATE_NETWORKS !== "false",
    proxyAllowedPorts: raw.PROXY_ALLOWED_PORTS ? parsePorts(raw.PROXY_ALLOWED_PORTS) : null,
    proxyMaxResponseBytes: Number(raw.PROXY_MAX_RESPONSE_BYTES ?? DEFAULT_MAX_BODY_BYTES),
    proxyMaxRequestBytes: Number(raw.PROXY_MAX_REQUEST_BYTES ?? DEFAULT_MAX_BODY_BYTES),
    proxyMaxTimeoutMilliseconds: Number(
      raw.PROXY_MAX_TIMEOUT_MS ?? DEFAULT_MAX_TIMEOUT_MILLISECONDS,
    ),
  };
  return serverEnv;
}
