import { mergeConfig } from "vitest/config";

import { vitestConfig } from "@api-studio/config/vitest";

export default mergeConfig(vitestConfig, {
  test: {
    coverage: {
      // docs/development/testing.md#required-coverage. Branches stop short of 100% only for the
      // defensive fallbacks noUncheckedIndexedAccess requires (e.g. a regex group that always
      // matches) and for assertNever defaults, which cannot run.
      thresholds: { lines: 95, statements: 95, functions: 100, branches: 90 },
    },
  },
});
