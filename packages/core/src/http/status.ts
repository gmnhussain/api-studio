/** The class of an HTTP status code (RFC 9110 §15), which decides its colour in the UI. */
export type StatusClass =
  "informational" | "success" | "redirection" | "client_error" | "server_error" | "unknown";

/** Classifies a status code by its first digit; anything outside 100–599 is `unknown`. */
export function getStatusClass(status: number): StatusClass {
  if (!Number.isInteger(status) || status < 100 || status > 599) return "unknown";
  if (status < 200) return "informational";
  if (status < 300) return "success";
  if (status < 400) return "redirection";
  if (status < 500) return "client_error";
  return "server_error";
}
