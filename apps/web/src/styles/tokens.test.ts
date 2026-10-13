// @vitest-environment node
import { readFileSync } from "node:fs";

import { blend, parse, wcagContrast, type Color } from "culori";
import { describe, expect, it } from "vitest";

/** WCAG 2.2 AA minimums (1.4.3 text, 1.4.11 non-text). */
const TEXT_CONTRAST = 4.5;
const NON_TEXT_CONTRAST = 3;

const ACCENTS = ["ion", "iris", "ember", "moss", "graphite"] as const;
const THEMES = ["light", "dark"] as const;

type TokenMap = ReadonlyMap<string, string>;

/** Reads `selector { --name: value; }` blocks; tokens.css keeps literal values for this reason. */
function readTokenBlocks(css: string): Map<string, Map<string, string>> {
  const blocks = new Map<string, Map<string, string>>();
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? "").trim();
    const declarations = new Map<string, string>();
    for (const declaration of (match[2] ?? "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      declarations.set(declaration[1] ?? "", (declaration[2] ?? "").trim());
    }
    blocks.set(selector, declarations);
  }
  return blocks;
}

const blocks = readTokenBlocks(readFileSync(new URL("./tokens.css", import.meta.url), "utf8"));

/** The effective token values for one theme and accent, applied in cascade order. */
function resolveTokens(theme: (typeof THEMES)[number], accent: (typeof ACCENTS)[number]): TokenMap {
  const selectors = [":root"];
  if (theme === "dark") selectors.push(".dark");
  if (accent !== "ion") {
    selectors.push(`:root[data-accent="${accent}"]`);
    if (theme === "dark") selectors.push(`:root[data-accent="${accent}"].dark`);
  }
  const tokens = new Map<string, string>();
  for (const selector of selectors) {
    for (const [name, value] of blocks.get(selector) ?? []) tokens.set(name, value);
  }
  return tokens;
}

function color(tokens: TokenMap, name: string): Color {
  const parsed = parse(tokens.get(`--${name}`) ?? "");
  if (!parsed) throw new Error(`Token --${name} is missing or not a colour`);
  return parsed;
}

/**
 * A background token, or `layer/base` for a translucent layer over a panel (a status badge tint
 * such as `success-muted/surface`).
 */
function backgroundColor(tokens: TokenMap, background: string): Color {
  const [layer = "", base] = background.split("/");
  return base ? blend([color(tokens, base), color(tokens, layer)]) : color(tokens, layer);
}

/** Contrast of a possibly translucent foreground drawn over a background. */
function contrast(tokens: TokenMap, foreground: string, background: string): number {
  const resolvedBackground = backgroundColor(tokens, background);
  const composited = blend([resolvedBackground, color(tokens, foreground)]);
  return wcagContrast(composited, resolvedBackground);
}

type ContrastRule = { foreground: string; backgrounds: readonly string[]; minimum: number };

const SURFACES = ["background", "surface", "surface-raised", "surface-hover"] as const;
const TEXT_ON_PANELS = ["background", "surface"] as const;

const RULES: readonly ContrastRule[] = [
  {
    foreground: "foreground",
    backgrounds: [...SURFACES, "surface-selected"],
    minimum: TEXT_CONTRAST,
  },
  { foreground: "muted-foreground", backgrounds: SURFACES, minimum: TEXT_CONTRAST },
  { foreground: "primary-foreground", backgrounds: ["primary"], minimum: TEXT_CONTRAST },
  {
    foreground: "primary",
    // Defined `{{variables}}` are accent text on an accent tint, in inputs on either panel.
    backgrounds: [...TEXT_ON_PANELS, "primary-muted/background", "primary-muted/surface"],
    minimum: TEXT_CONTRAST,
  },
  { foreground: "subtle-foreground", backgrounds: TEXT_ON_PANELS, minimum: NON_TEXT_CONTRAST },
  { foreground: "ring", backgrounds: TEXT_ON_PANELS, minimum: NON_TEXT_CONTRAST },
  // Status text also sits on its own tint, as in a "200 OK" badge.
  ...["success", "warning", "danger", "info"].map((name) => ({
    foreground: name,
    backgrounds: [...TEXT_ON_PANELS, `${name}-muted/background`, `${name}-muted/surface`],
    minimum: TEXT_CONTRAST,
  })),
  // Method labels also sit on the selected row of the collection tree.
  ...["get", "post", "put", "patch", "delete", "options", "head"].map((method) => ({
    foreground: `method-${method}`,
    backgrounds: [...TEXT_ON_PANELS, "surface-selected"],
    minimum: TEXT_CONTRAST,
  })),
];

describe("design tokens", () => {
  for (const theme of THEMES) {
    for (const accent of ACCENTS) {
      const tokens = resolveTokens(theme, accent);

      describe(`${theme} theme, ${accent} accent`, () => {
        for (const rule of RULES) {
          for (const background of rule.backgrounds) {
            it(`--${rule.foreground} on --${background} meets ${String(rule.minimum)}:1`, () => {
              expect(contrast(tokens, rule.foreground, background)).toBeGreaterThanOrEqual(
                rule.minimum,
              );
            });
          }
        }
      });
    }
  }
});
