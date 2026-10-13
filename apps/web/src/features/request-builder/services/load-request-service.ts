import type { RequestServiceOptions } from "./request-service-instance";
import type { RequestService } from "./request.service";

/** Loads the request service and its IndexedDB code in their own chunk. */
export async function loadRequestService(options: RequestServiceOptions): Promise<RequestService> {
  const { getRequestService } = await import("./request-service-instance");
  return getRequestService(options);
}
