import { defineConfig } from "vitest/config";

/**
 * Shared Vitest config (docs/development/testing.md).
 * - Unit and component tests: `*.test.ts(x)` next to the code.
 * - Integration tests: `*.int.test.ts` (e.g. the runner against a local HTTP server).
 * Run one kind with `vitest run --project unit|integration`.
 */
export const vitestConfig = defineConfig({
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/**"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
          exclude: ["**/*.int.test.ts", "**/node_modules/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.int.test.ts", "test/**/*.int.test.ts"],
          testTimeout: 30_000,
        },
      },
    ],
  },
});
