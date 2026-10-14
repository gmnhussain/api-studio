import { createRegistry, type RequestExecutor } from "@api-studio/core";

import { createBrowserExecutor } from "@/lib/executors/browser-executor";
import { createProxyExecutor } from "@/lib/executors/proxy-executor";

/** The transports requests can go through (extensibility.md#registries). */
export const executors = createRegistry<RequestExecutor>("Executors");

let isRegistered = false;

/** Registers the proxy and browser executors once; a desktop shell would add its own. */
export function registerBuiltInExecutors(): void {
  if (isRegistered) return;
  executors.register(createProxyExecutor());
  executors.register(createBrowserExecutor());
  isRegistered = true;
}
