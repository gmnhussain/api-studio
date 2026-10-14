import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import packageManifest from "./package.json" with { type: "json" };

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  // The default bottom-left position covers the activity rail's Settings button.
  devIndicators: { position: "bottom-right" },
  // Workspace packages ship TypeScript source; Next.js compiles them with the app.
  transpilePackages: ["@api-studio/core"],
  // Only the version reaches the browser; importing package.json there would ship all of it.
  env: { NEXT_PUBLIC_APP_VERSION: packageManifest.version },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
