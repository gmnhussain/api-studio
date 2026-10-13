import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  // Workspace packages ship TypeScript source; Next.js compiles them with the app.
  transpilePackages: ["@api-studio/core"],
};

export default nextConfig;
