import { defineConfig } from "eslint/config";

import { next } from "@api-studio/config/eslint/next";

export default defineConfig([
  ...next(import.meta.dirname),
  {
    // Labels are checked where they are used: <Label htmlFor> must point at a control.
    files: ["**/*.tsx"],
    rules: {
      "jsx-a11y/label-has-associated-control": [
        "error",
        { labelComponents: ["Label"], controlComponents: ["Input", "Switch"], assert: "either" },
      ],
    },
  },
  {
    // The Label primitive only forwards htmlFor from its call sites, which the rule checks.
    files: ["src/components/ui/label.tsx"],
    rules: { "jsx-a11y/label-has-associated-control": "off" },
  },
]);
