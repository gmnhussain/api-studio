/** Port of the local API the suite sends requests to (test-api-server.ts). */
export const TEST_API_PORT = 3201;

/** A URL on the local test API. */
export function testApiUrl(path: string): string {
  return `http://127.0.0.1:${String(TEST_API_PORT)}${path}`;
}
