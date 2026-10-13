import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  // The default bottom-left position covers the activity rail's Settings button.
  devIndicators: { position: "bottom-right" },
  // Workspace packages ship TypeScript source; Next.js compiles them with the app.
  transpilePackages: ["@api-studio/core"],
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
