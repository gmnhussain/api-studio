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
  },
});
