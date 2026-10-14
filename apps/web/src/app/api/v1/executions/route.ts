import { executionRequestSchema } from "@api-studio/core";

import { getRunner } from "./runner-instance";
import { HTTP_BAD_REQUEST, problemResponse } from "../../problem-details";

/** The runner needs Node: sockets, DNS and zlib. */
export const runtime = "nodejs";

/**
 * Executes a request through the runner (request-execution.md#proxy-endpoint). The body is
 * validated; an expected failure is a `200` with an `error` outcome, so only a broken call to
 * this endpoint is an HTTP error. A client cancel aborts the upstream request. Nothing about the
 * request is logged.
 */
export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return problemResponse({ status: HTTP_BAD_REQUEST, title: "The body is not valid JSON" });
  }
  const parsed = executionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return problemResponse({
      status: HTTP_BAD_REQUEST,
      title: "The execution request is invalid",
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    });
  }

  const result = await getRunner().execute(parsed.data.request, {
    ...parsed.data.options,
    signal: request.signal,
  });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
