import { defineConfig } from "eslint/config";
import globals from "globals";

import { base } from "./base.js";

/**
 * For Node-only packages (packages/runner) and future server apps (apps/cli).
 *
 * @param {string} tsconfigRootDir
 */
export function node(tsconfigRootDir) {
  return defineConfig([
    ...base(tsconfigRootDir),
    {
      languageOptions: { globals: globals.node },
    },
  ]);
}
