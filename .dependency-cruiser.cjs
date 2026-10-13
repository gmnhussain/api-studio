// Module boundaries from docs/architecture/overview.md#module-boundaries-enforced-by-dependency-cruiser.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment: "Every import must resolve; an undeclared workspace dependency shows up here.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular imports make module boundaries meaningless.",
      from: {},
      to: { circular: true },
    },
    {
      name: "packages-not-to-apps",
      severity: "error",
      comment: "Dependency direction is apps → packages, never the reverse.",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "apps-not-to-apps",
      severity: "error",
      comment: "Apps are separate deployables; share code through packages.",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/", pathNot: "^apps/$1/" },
    },
    {
      name: "core-is-framework-free",
      severity: "error",
      comment:
        "packages/core runs in browsers and Node: no Node built-ins, no UI frameworks, no storage libraries (ADR-0001).",
      from: { path: "^packages/core/src/", pathNot: "\\.test\\.ts$" },
      to: {
        dependencyTypes: ["core"],
      },
    },
    {
      name: "core-has-no-framework-dependencies",
      severity: "error",
      comment: "packages/core must not depend on React, Next.js, Dexie, Zustand or TanStack.",
      from: { path: "^packages/core/src/" },
      to: { path: "node_modules/(react|react-dom|next|dexie|zustand|@tanstack)/" },
    },
    {
      name: "core-depends-on-no-workspace-package",
      severity: "error",
      comment: "packages/core is the bottom layer; it imports no other workspace package.",
      from: { path: "^packages/core/src/" },
      to: { path: "^packages/", pathNot: "^packages/core/" },
    },
    {
      name: "runner-depends-only-on-core",
      severity: "error",
      comment: "packages/runner may use packages/core and nothing else from the workspace.",
      from: { path: "^packages/runner/src/" },
      to: { path: "^packages/", pathNot: "^packages/(runner|core)/" },
    },
    {
      name: "runner-only-from-route-handlers",
      severity: "error",
      comment:
        "The runner is server-only; in the web app only Route Handlers under app/api may import it.",
      from: { path: "^apps/web/", pathNot: "^apps/web/src/app/api/" },
      to: { path: "^packages/runner/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: ["(^|/)(node_modules|dist|out|coverage|\\.next|\\.turbo)/", "next-env\\.d\\.ts$"],
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"],
      mainFields: ["module", "main", "types", "typings"],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
