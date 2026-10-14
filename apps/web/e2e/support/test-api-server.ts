/**
 * A small API the end-to-end suite sends requests to, so tests never depend on the internet.
 * Run with Node's type stripping: `node e2e/support/test-api-server.ts <port>`. Every response
 * allows CORS, so browser mode works against it too.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const DEFAULT_PORT = 3201;
const SLOW_RESPONSE_MILLISECONDS = 5000;
const port = Number(process.argv[2] ?? DEFAULT_PORT);

function send(
  response: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string | string[]> = {},
): void {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

function handle(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url ?? "/", `http://localhost:${String(port)}`);
  if (request.method === "OPTIONS") {
    send(response, 204, null);
    return;
  }
  switch (url.pathname) {
    case "/health":
      send(response, 200, { status: "ok" });
      return;
    case "/users/1":
      send(response, 200, {
        id: 1,
        name: "Ada Lovelace",
        query: Object.fromEntries(url.searchParams),
      });
      return;
    case "/login":
      send(
        response,
        200,
        { loggedIn: true },
        { "Set-Cookie": "session=e2e-session; Path=/; HttpOnly" },
      );
      return;
    case "/me":
      send(response, 200, { cookie: request.headers.cookie ?? null });
      return;
    case "/redirect":
      response.writeHead(302, { Location: "/users/1", "Access-Control-Allow-Origin": "*" });
      response.end();
      return;
    case "/slow":
      setTimeout(() => {
        send(response, 200, { slow: true });
      }, SLOW_RESPONSE_MILLISECONDS);
      return;
    default:
      send(response, 404, { error: "Not found" });
  }
}

createServer(handle).listen(port, "127.0.0.1");
