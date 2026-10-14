import "server-only";

import { createRunner, type Runner } from "@api-studio/runner";

import { getServerEnv } from "@/config/server-env";

let runner: Runner | undefined;

/**
 * The server's runner, created on first use from the server configuration. One instance keeps
 * connections pooled across executions.
 */
export function getRunner(): Runner {
  if (!runner) {
    const env = getServerEnv();
    runner = createRunner({
      allowPrivateNetworks: env.proxyAllowPrivateNetworks,
      allowedPorts: env.proxyAllowedPorts,
      maxResponseBytes: env.proxyMaxResponseBytes,
      maxRequestBytes: env.proxyMaxRequestBytes,
      maxTimeoutMilliseconds: env.proxyMaxTimeoutMilliseconds,
    });
  }
  return runner;
}
