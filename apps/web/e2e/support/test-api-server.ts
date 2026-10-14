/**
 * A small API the end-to-end suite sends requests to, so tests never depend on the internet.
 * Run with Node's type stripping: `node e2e/support/test-api-server.ts <port>`. Every response
 * allows CORS, so browser mode works against it too.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const DEFAULT_PORT = 3201;
const SLOW_RESPONSE_MILLISECONDS = 5000;
const port = Number(process.argv[2] ?? DEFAULT_PORT);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Expose-Headers": "*",
};

/** A 1 × 1 PNG, for the image preview. */
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const HTML_PAGE = [
  "<!doctype html><title>Preview</title>",
  '<h1 id="greeting">Hello preview</h1>',
  '<script>document.getElementById("greeting").textContent = "Scripts ran";</script>',
].join("");

const MARKDOWN_PAGE = ["# Release notes", "", "- **Faster** trees", "- Safe previews", ""].join(
  "\n",
);

const BYTES_PER_MEGABYTE = 1024 * 1024;
const largeBodies = new Map<number, string>();

/** A JSON array of about `megabytes` MB, built once per size. */
function largeJson(megabytes: number): string {
  const cached = largeBodies.get(megabytes);
  if (cached) return cached;
  const items: string[] = [];
  let length = 2;
  for (let index = 0; length < megabytes * BYTES_PER_MEGABYTE; index += 1) {
    const item = JSON.stringify({
      id: index,
      name: `User ${String(index)}`,
      email: `user${String(index)}@example.com`,
      active: index % 2 === 0,
      tags: ["alpha", "beta"],
    });
    items.push(item);
    length += item.length + 1;
  }
  const body = `[${items.join(",")}]`;
  largeBodies.set(megabytes, body);
  return body;
}

function sendRaw(
  response: ServerResponse,
  status: number,
  body: string | Buffer,
  headers: Record<string, string | string[]>,
): void {
  response.writeHead(status, { ...CORS_HEADERS, ...headers });
  response.end(body);
}

function send(
  response: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string | string[]> = {},
): void {
  response.writeHead(status, { "Content-Type": "application/json", ...CORS_HEADERS, ...headers });
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
    case "/large.json":
      sendRaw(response, 200, largeJson(Number(url.searchParams.get("megabytes") ?? "1")), {
        "Content-Type": "application/json",
      });
      return;
    case "/page.html":
      sendRaw(response, 200, HTML_PAGE, { "Content-Type": "text/html; charset=utf-8" });
      return;
    case "/pixel.png":
      sendRaw(response, 200, PIXEL_PNG, { "Content-Type": "image/png" });
      return;
    case "/readme.md":
      sendRaw(response, 200, MARKDOWN_PAGE, { "Content-Type": "text/markdown; charset=utf-8" });
      return;
    case "/report":
      sendRaw(response, 200, ["id,name", "1,Ada", ""].join("\n"), {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="report.csv"',
      });
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
