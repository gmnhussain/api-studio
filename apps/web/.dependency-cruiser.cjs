// The root rules, the `@/*` alias (see .dependency-cruiser.next-app.cjs) and the feature-slice
// boundaries from docs/architecture/overview.md#layers-inside-the-app.
/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  extends: "../../.dependency-cruiser.cjs",
  forbidden: [
    {
      name: "features-through-index",
      severity: "error",
      comment: "A feature imports another feature only through its index.ts (its public API).",
      from: { path: "^apps/web/src/features/([^/]+)/" },
      to: {
        path: "^apps/web/src/features/[^/]+/",
        pathNot: ["^apps/web/src/features/$1/", "^apps/web/src/features/[^/]+/index\\.tsx?$"],
      },
    },
    {
      name: "outside-features-through-index",
      severity: "error",
      comment: "Routes and other code use a feature only through its index.ts.",
      from: { path: "^apps/web/src/", pathNot: "^apps/web/src/features/" },
      to: {
        path: "^apps/web/src/features/[^/]+/",
        pathNot: "^apps/web/src/features/[^/]+/index\\.tsx?$",
      },
    },
    {
      name: "shared-code-not-to-features",
      severity: "error",
      comment:
        "Shared code (components, hooks, lib, stores, config, constants, types) never imports a feature.",
      from: { path: "^apps/web/src/(components|hooks|lib|stores|config|constants|types)/" },
      to: { path: "^apps/web/src/features/" },
    },
  ],
  options: {
    webpackConfig: {
      fileName: "./.dependency-cruiser.next-app.cjs",
      env: { app: "web" },
    },
  },
};
