import type { ExecutionService } from "./execution.service";

/** Loads the execution service and its IndexedDB code in their own chunk. */
export async function loadExecutionService(): Promise<ExecutionService> {
  const { getExecutionService } = await import("./execution-service-instance");
  return getExecutionService();
}
