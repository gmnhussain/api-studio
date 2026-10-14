/**
 * Runs once when a Next.js server starts: validates the server configuration so a bad value stops
 * the server at startup instead of failing the first request (overview.md#cross-cutting).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getServerEnv } = await import("./config/server-env");
  getServerEnv();
}
