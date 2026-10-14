/** Languages the code editor highlights; more join with response viewers (M5). */
export const CODE_EDITOR_LANGUAGES = ["json", "xml", "plaintext"] as const;
export type CodeEditorLanguage = (typeof CODE_EDITOR_LANGUAGES)[number];

/** Props for `CodeEditor`, independent of the editor library behind it (ADR-0009). */
export type CodeEditorProps = {
  value: string;
  onValueChange?: (value: string) => void;
  language: CodeEditorLanguage;
  isReadOnly?: boolean;
  "aria-label": string;
};
