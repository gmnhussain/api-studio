const path = require("node:path");

/**
 * Resolves a Next.js app's `@/*` alias (its tsconfig `paths`) for dependency-cruiser.
 * The tsconfig route resolves `paths` from the working directory when there is no `baseUrl`
 * (deprecated in TypeScript 6), and the rules need the cruise to run from the repo root.
 *
 * @param {{ app: string }} env
 */
module.exports = (env) => ({
  resolve: {
    alias: {
      "@": path.join(__dirname, "apps", env.app, "src"),
      "@test": path.join(__dirname, "apps", env.app, "test"),
    },
  },
});
