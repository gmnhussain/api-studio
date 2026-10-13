import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import turbo from "eslint-plugin-turbo";

import { base } from "./base.js";

/** Files where Next.js requires a default export. */
const NEXT_DEFAULT_EXPORT_FILES = [
  "src/app/**/{page,layout,template,loading,error,global-error,not-found,default}.tsx",
  "src/app/**/{opengraph-image,twitter-image,icon,apple-icon,sitemap,robots,manifest}.{ts,tsx}",
];

/**
 * For the Next.js app (apps/web).
 *
 * @param {string} tsconfigRootDir
 */
export function next(tsconfigRootDir) {
  return defineConfig([
    ...nextVitals,
    ...base(tsconfigRootDir),
    {
      // eslint-config-next registers jsx-a11y with a few rules; turn on the full recommended set.
      rules: jsxA11y.flatConfigs.recommended.rules,
    },
    {
      plugins: { turbo },
      rules: {
        // NEXT_PUBLIC_* values are inlined at build time, so Turborepo must hash them.
        "turbo/no-undeclared-env-vars": "error",
      },
    },
    {
      files: NEXT_DEFAULT_EXPORT_FILES,
      rules: { "import-x/no-default-export": "off" },
    },
    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  ]);
}
