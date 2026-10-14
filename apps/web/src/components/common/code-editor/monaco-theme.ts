import type { editor } from "monaco-editor";

/** The theme name Monaco knows our tokens by; redefined whenever the app theme changes. */
export const MONACO_THEME_NAME = "api-studio";

/** Alpha of the resting scrollbar, as a hex suffix (60%). */
const SCROLLBAR_ALPHA = "99";

/** Used only where a canvas is unavailable (never in a real browser), so the theme stays valid. */
const FALLBACK_COLOR = "#000000";

/** Hex digits per colour channel. */
const HEX_CHANNEL_LENGTH = 2;

/**
 * A design token as `#rrggbb`, which Monaco themes require. Tokens are OKLCH (tokens.css), so the
 * browser converts them: a one-pixel canvas is painted with the token and read back.
 */
function resolveTokenColor(context: CanvasRenderingContext2D, token: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(HEX_CHANNEL_LENGTH, "0"))
    .join("")}`;
}

/**
 * A Monaco theme generated from the current design tokens (ADR-0009), so the editor matches the
 * app in dark and light mode and with every accent. Syntax colours reuse the semantic tokens.
 */
export function buildMonacoTheme(isDark: boolean): editor.IStandaloneThemeData {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const color = (token: string) => (context ? resolveTokenColor(context, token) : FALLBACK_COLOR);
  const syntax = (token: string) => color(token).slice(1);

  return {
    base: isDark ? "vs-dark" : "vs",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: syntax("primary") },
      { token: "string.value.json", foreground: syntax("success") },
      { token: "string", foreground: syntax("success") },
      { token: "number", foreground: syntax("warning") },
      { token: "keyword", foreground: syntax("info") },
      { token: "tag", foreground: syntax("primary") },
      { token: "attribute.name", foreground: syntax("info") },
      { token: "attribute.value", foreground: syntax("success") },
      { token: "delimiter", foreground: syntax("muted-foreground") },
      { token: "comment", foreground: syntax("muted-foreground"), fontStyle: "italic" },
    ],
    colors: {
      "editor.background": color("background"),
      "editor.foreground": color("foreground"),
      "editorLineNumber.foreground": color("subtle-foreground"),
      "editorLineNumber.activeForeground": color("muted-foreground"),
      "editor.lineHighlightBackground": color("surface"),
      "editor.lineHighlightBorder": color("surface"),
      "editor.selectionBackground": color("surface-selected"),
      "editorCursor.foreground": color("primary"),
      "editorIndentGuide.background1": color("border"),
      "editorWidget.background": color("surface-raised"),
      "editorWidget.border": color("border"),
      "editorSuggestWidget.background": color("surface-raised"),
      "editorSuggestWidget.selectedBackground": color("surface-hover"),
      focusBorder: color("ring"),
      "scrollbarSlider.background": `${color("border")}${SCROLLBAR_ALPHA}`,
      "scrollbarSlider.hoverBackground": color("border"),
    },
  };
}
