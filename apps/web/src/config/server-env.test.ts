// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/** A fresh copy of the module, since it caches the parsed configuration. */
async function loadServerEnv() {
  vi.resetModules();
  const { getServerEnv } = await import("./server-env");
  return getServerEnv();
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getServerEnv", () => {
  it("uses local defaults when nothing is set", async () => {
    for (const name of [
      "PROXY_ALLOW_PRIVATE_NETWORKS",
      "PROXY_ALLOWED_PORTS",
      "PROXY_MAX_RESPONSE_BYTES",
      "PROXY_MAX_REQUEST_BYTES",
      "PROXY_MAX_TIMEOUT_MS",
    ]) {
      vi.stubEnv(name, undefined);
    }

    expect(await loadServerEnv()).toEqual({
      proxyAllowPrivateNetworks: true,
      proxyAllowedPorts: null,
      proxyMaxResponseBytes: 52_428_800,
      proxyMaxRequestBytes: 52_428_800,
      proxyMaxTimeoutMilliseconds: 600_000,
    });
  });

  it("reads a public-demo configuration", async () => {
    vi.stubEnv("PROXY_ALLOW_PRIVATE_NETWORKS", "false");
    vi.stubEnv("PROXY_ALLOWED_PORTS", "80, 443,8080");
    vi.stubEnv("PROXY_MAX_RESPONSE_BYTES", "10485760");
    vi.stubEnv("PROXY_MAX_TIMEOUT_MS", "30000");

    expect(await loadServerEnv()).toMatchObject({
      proxyAllowPrivateNetworks: false,
      proxyAllowedPorts: [80, 443, 8080],
      proxyMaxResponseBytes: 10_485_760,
      proxyMaxTimeoutMilliseconds: 30_000,
    });
  });

  it.each([
    ["PROXY_ALLOW_PRIVATE_NETWORKS", "yes"],
    ["PROXY_MAX_TIMEOUT_MS", "0"],
    ["PROXY_MAX_RESPONSE_BYTES", "-5"],
    ["PROXY_ALLOWED_PORTS", "80,http"],
    ["PROXY_ALLOWED_PORTS", "70000"],
  ])("refuses %s=%s", async (name, value) => {
    vi.stubEnv(name, value);

    await expect(loadServerEnv()).rejects.toThrow(/PROXY_/);
  });
});
