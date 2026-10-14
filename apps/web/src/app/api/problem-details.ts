import "server-only";

/** The request could not be understood: unreadable JSON or an invalid shape. */
export const HTTP_BAD_REQUEST = 400;

/** Media type of an error body (RFC 9457). */
const PROBLEM_JSON = "application/problem+json";

/** What went wrong with a request to the API, as RFC 9457 problem details. */
export type ProblemDetails = {
  status: number;
  title: string;
  detail?: string;
  /** Field-level problems, such as schema validation issues. */
  errors?: readonly string[];
};

/** A problem details response. */
export function problemResponse({ status, ...problem }: ProblemDetails): Response {
  return Response.json(
    { type: "about:blank", status, ...problem },
    { status, headers: { "Content-Type": PROBLEM_JSON } },
  );
}
