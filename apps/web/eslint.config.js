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
        {
          labelComponents: ["Label", "FieldLabel"],
          controlComponents: ["Input", "Switch"],
          assert: "either",
        },
      ],
    },
  },
  {
    // Label primitives only forward htmlFor from their call sites, which the rule checks.
    files: ["src/components/ui/label.tsx", "src/components/ui/field.tsx"],
    rules: { "jsx-a11y/label-has-associated-control": "off" },
  },
]);
