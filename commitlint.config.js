// Conventional Commits (docs/development/git-workflow.md#commit-messages), checked in CI.

/** Scopes are package or feature names; keep in sync with git-workflow.md. */
const SCOPES = [
  // Packages and apps
  "core",
  "runner",
  "config",
  "web",
  // Features
  "shell",
  "workspace",
  "collections",
  "request-builder",
  "response-viewer",
  "execution",
  "tabs",
  "history",
  "environments",
  "console",
  "command-palette",
  "search",
  "code-generation",
  "import-export",
  "settings",
  "onboarding",
  // Docs and repository
  "design",
  "architecture",
  "adr",
  "product",
  "development",
  "planning",
  "deps",
  "ci",
  "github",
];

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", SCOPES],
    "body-max-line-length": [2, "always", 100],
  },
};
