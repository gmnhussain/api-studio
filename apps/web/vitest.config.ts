import { fileURLToPath } from "node:url";

import { mergeConfig } from "vitest/config";

import { vitestConfig } from "@api-studio/config/vitest";

export default mergeConfig(vitestConfig, {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@test": fileURLToPath(new URL("./test", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup-tests.ts"],
    // jsdom component tests slow down several times when Turborepo runs them beside `next build`;
    // the timeout catches hangs, while speed is budgeted in the E2E suite.
    testTimeout: 15_000,
  },
});
