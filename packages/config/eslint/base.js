import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import { importX } from "eslint-plugin-import-x";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Files whose tools require a default export. */
const DEFAULT_EXPORT_FILES = ["**/*.config.{js,mjs,cjs,ts}", "**/prettier.js"];

/**
 * Type-aware base config shared by every package (ADR-0007).
 *
 * @param {string} tsconfigRootDir Package directory, so the TypeScript project service finds the right tsconfig.
 */
export function base(tsconfigRootDir) {
  return defineConfig([
    globalIgnores(["**/dist/**", "**/coverage/**", "**/.turbo/**"]),
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        // A forgotten await on an execution or a storage write is a silent bug (ADR-0007).
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "no-restricted-syntax": [
          "error",
          {
            selector: "TSEnumDeclaration",
            message: "Use a const object with a literal union instead of an enum (conventions.md).",
          },
        ],
        "import-x/no-duplicates": "error",
        "import-x/no-cycle": "error",
        "import-x/no-default-export": "error",
        "import-x/order": [
          "error",
          {
            groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
            pathGroups: [
              { pattern: "@api-studio/**", group: "internal", position: "before" },
              { pattern: "@/**", group: "internal" },
            ],
            pathGroupsExcludedImportTypes: ["builtin"],
            "newlines-between": "always",
            alphabetize: { order: "asc", caseInsensitive: true },
          },
        ],
        // TypeScript already resolves imports; these duplicate it with more noise.
        "import-x/no-unresolved": "off",
        "import-x/namespace": "off",
        "import-x/default": "off",
        "import-x/no-named-as-default-member": "off",
        eqeqeq: ["error", "always"],
        "no-console": "error",
      },
    },
    {
      files: DEFAULT_EXPORT_FILES,
      rules: { "import-x/no-default-export": "off" },
    },
    {
      files: ["**/*.{js,mjs,cjs}"],
      extends: [tseslint.configs.disableTypeChecked],
    },
    {
      // Tool configs that must be CommonJS (e.g. .dependency-cruiser.cjs) run in Node.
      files: ["**/*.cjs"],
      languageOptions: { sourceType: "commonjs", globals: globals.node },
      rules: { "@typescript-eslint/no-require-imports": "off" },
    },
    prettier,
  ]);
}
