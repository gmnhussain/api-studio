import { describe, expect, it } from "vitest";

import { DEFAULT_APPEARANCE } from "./settings.constants";
import { parseAppearance } from "./settings.schema";

describe("parseAppearance", () => {
  it("keeps a valid appearance as is", () => {
    const appearance = { theme: "light", accent: "moss", density: "compact", motion: "reduce" };

    expect(parseAppearance(appearance)).toEqual(appearance);
  });

  it("replaces only the invalid fields with their defaults", () => {
    expect(parseAppearance({ theme: "sepia", accent: "iris", density: 3 })).toEqual({
      ...DEFAULT_APPEARANCE,
      accent: "iris",
    });
  });

  it.each([undefined, null, "dark", 42, []])("falls back to the defaults for %j", (saved) => {
    expect(parseAppearance(saved)).toEqual(DEFAULT_APPEARANCE);
  });
});
