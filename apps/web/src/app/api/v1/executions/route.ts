import { executionRequestSchema } from "@api-studio/core";

import { getServerEnv } from "@/config/server-env";

import { getRunner } from "./runner-instance";
import { HTTP_BAD_REQUEST, problemResponse } from "../../problem-details";
import {
  BodyTooLargeError,
  bodyTooLargeResponse,
  readBodyText,
  refuseUntrustedCaller,
} from "../../request-guards";

/** The runner needs Node: sockets, DNS and zlib. */
export const runtime = "nodejs";

/**
 * Room for the JSON around a request body: escaping can double text, and headers, URL and
 * options come on top.
 */
const ENVELOPE_GROWTH_FACTOR = 2;
const ENVELOPE_OVERHEAD_BYTES = 1024 * 1024;

/**
 * Executes a request through the runner (request-execution.md#proxy-endpoint). Only the app's
 * own pages may call it, with a JSON body of bounded size, which is then validated. An expected
 * failure is a `200` with an `error` outcome, so only a broken call to this endpoint is an HTTP
 * error. A client cancel aborts the upstream request. Nothing about the request is logged.
 */
export async function POST(request: Request): Promise<Response> {
  const refusal = refuseUntrustedCaller(request);
  if (refusal) return refusal;

  const maxBodyBytes =
    getServerEnv().proxyMaxRequestBytes * ENVELOPE_GROWTH_FACTOR + ENVELOPE_OVERHEAD_BYTES;
  let input: unknown;
  try {
    input = JSON.parse(await readBodyText(request, maxBodyBytes));
  } catch (error) {
    if (error instanceof BodyTooLargeError) return bodyTooLargeResponse();
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
