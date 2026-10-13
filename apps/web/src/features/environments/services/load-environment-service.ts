import type { EnvironmentService } from "./environment.service";

/** Loads the environment service and its IndexedDB code in their own chunk. */
export async function loadEnvironmentService(): Promise<EnvironmentService> {
  const { getEnvironmentService } = await import("./environment-service-instance");
  return getEnvironmentService();
}
