import { defineConfig } from "eslint/config";

import { base } from "./base.js";

/** Globals that exist only in a browser or only in Node; isomorphic code must not touch them. */
const PLATFORM_GLOBALS = [
  "window",
  "document",
  "navigator",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "location",
  "process",
  "Buffer",
  "__dirname",
  "__filename",
];

/**
 * For framework-free packages that run in browsers and Node (packages/core).
 * Web-standard globals (URL, AbortSignal, TextEncoder) are fine; platform globals are not.
 *
 * @param {string} tsconfigRootDir
 */
export function isomorphic(tsconfigRootDir) {
  return defineConfig([
    ...base(tsconfigRootDir),
    {
      files: ["src/**/*.ts"],
      ignores: ["**/*.test.ts"],
      rules: {
        "no-restricted-globals": [
          "error",
          ...PLATFORM_GLOBALS.map((name) => ({
            name,
            message: "packages/core runs in browsers and Node; pass platform values in instead.",
          })),
        ],
      },
    },
  ]);
}
