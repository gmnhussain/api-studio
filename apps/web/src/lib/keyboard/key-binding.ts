/**
 * Key bindings are written as strings such as `"Mod+B"` or `"Mod+Alt+R"`
 * (docs/design/layout-and-interaction.md#keyboard-shortcuts). `Mod` is ⌘ on Apple platforms and
 * Ctrl elsewhere. The last segment is the key, matched against `KeyboardEvent.key`.
 */
export type KeyBinding = string;

/** A parsed key binding. */
export type ParsedKeyBinding = {
  key: string;
  mod: boolean;
  alt: boolean;
  shift: boolean;
};

const MODIFIERS = ["Mod", "Alt", "Shift"] as const;
type Modifier = (typeof MODIFIERS)[number];

function isModifier(segment: string): segment is Modifier {
  return (MODIFIERS as readonly string[]).includes(segment);
}

/**
 * Parses a binding such as `"Mod+Shift+K"`.
 *
 * @throws {Error} When the binding has no key, an unknown modifier or a repeated modifier.
 */
export function parseKeyBinding(binding: KeyBinding): ParsedKeyBinding {
  const segments = binding.split("+");
  const key = segments.pop();
  if (!key) throw new Error(`Key binding "${binding}" has no key`);

  const parsed: ParsedKeyBinding = { key, mod: false, alt: false, shift: false };
  for (const segment of segments) {
    if (!isModifier(segment)) throw new Error(`Unknown modifier "${segment}" in "${binding}"`);
    const field = segment === "Mod" ? "mod" : segment === "Alt" ? "alt" : "shift";
    if (parsed[field]) throw new Error(`Modifier "${segment}" repeated in "${binding}"`);
    parsed[field] = true;
  }
  return parsed;
}

/** The parts of a keyboard event a binding is matched against. */
export type KeyboardEventLike = Pick<
  KeyboardEvent,
  "key" | "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey"
>;

/**
 * Tells whether a keyboard event triggers a binding. Letters match case-insensitively, and the
 * physical key (`code`) is used as a fallback so Alt combinations work on macOS, where Alt changes
 * `key` (Alt+N types "˜").
 *
 * @param isApplePlatform Whether `Mod` means ⌘ (true) or Ctrl (false).
 */
export function matchesKeyBinding(
  event: KeyboardEventLike,
  binding: ParsedKeyBinding,
  isApplePlatform: boolean,
): boolean {
  const modPressed = isApplePlatform ? event.metaKey : event.ctrlKey;
  const otherCommandKeyPressed = isApplePlatform ? event.ctrlKey : event.metaKey;
  if (modPressed !== binding.mod || otherCommandKeyPressed) return false;
  if (event.altKey !== binding.alt || event.shiftKey !== binding.shift) return false;

  const wanted = binding.key.toLowerCase();
  if (event.key.toLowerCase() === wanted) return true;
  return wanted.length === 1 && event.code.toLowerCase() === codeForCharacter(wanted);
}

/** Physical keys of punctuation used in bindings, lower-cased like the comparison. */
const PUNCTUATION_CODES: Readonly<Record<string, string>> = {
  "[": "bracketleft",
  "]": "bracketright",
  ",": "comma",
  "/": "slash",
};

/**
 * `KeyboardEvent.code` for a single letter, digit or bound punctuation mark (`"b"` → `"keyb"`,
 * `"1"` → `"digit1"`, `"]"` → `"bracketright"`), lower-cased.
 */
function codeForCharacter(character: string): string | undefined {
  if (/^[a-z]$/.test(character)) return `key${character}`;
  if (/^[0-9]$/.test(character)) return `digit${character}`;
  return PUNCTUATION_CODES[character];
}

/**
 * The binding in `aria-keyshortcuts` syntax: `Mod` becomes `Meta` on Apple platforms and
 * `Control` elsewhere (WAI-ARIA 1.2).
 */
export function toAriaKeyShortcuts(binding: ParsedKeyBinding, isApplePlatform: boolean): string {
  const modifiers = [
    binding.mod ? (isApplePlatform ? "Meta" : "Control") : null,
    binding.alt ? "Alt" : null,
    binding.shift ? "Shift" : null,
  ].filter((modifier) => modifier !== null);
  const key = binding.key.length === 1 ? binding.key.toUpperCase() : binding.key;
  return [...modifiers, key].join("+");
}

const APPLE_SYMBOLS: Readonly<Record<string, string>> = { mod: "⌘", alt: "⌥", shift: "⇧" };
const OTHER_LABELS: Readonly<Record<string, string>> = { mod: "Ctrl", alt: "Alt", shift: "Shift" };
const KEY_LABELS: Readonly<Record<string, string>> = {
  Enter: "↵",
  Escape: "Esc",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  " ": "Space",
};

/**
 * The visible parts of a binding, in platform order: `["⌘", "B"]` on macOS, `["Ctrl", "B"]`
 * elsewhere. Each part is rendered in its own `<kbd>`.
 */
export function formatKeyBinding(binding: ParsedKeyBinding, isApplePlatform: boolean): string[] {
  const labels = isApplePlatform ? APPLE_SYMBOLS : OTHER_LABELS;
  const modifiers = (["mod", "alt", "shift"] as const)
    .filter((modifier) => binding[modifier])
    .map((modifier) => labels[modifier] ?? modifier);
  const key =
    KEY_LABELS[binding.key] ?? (binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);
  return [...modifiers, key];
}
