/** Languages the code editor highlights: request bodies and the response formats it shows. */
export const CODE_EDITOR_LANGUAGES = [
  "json",
  "xml",
  "html",
  "markdown",
  "javascript",
  "css",
  "plaintext",
] as const;
export type CodeEditorLanguage = (typeof CODE_EDITOR_LANGUAGES)[number];

/** Props for `CodeEditor`, independent of the editor library behind it (ADR-0009). */
export type CodeEditorProps = {
  value: string;
  onValueChange?: (value: string) => void;
  language: CodeEditorLanguage;
  isReadOnly?: boolean;
  "aria-label": string;
};
