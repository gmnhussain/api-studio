import type { ResponseBodyFormat } from "@api-studio/core";

import type { CodeEditorLanguage } from "@/components/common/code-editor/code-editor-props";

/** How the code editor highlights each body format; SVG images are XML. */
const LANGUAGES_BY_FORMAT: Readonly<Record<ResponseBodyFormat, CodeEditorLanguage>> = {
  json: "json",
  xml: "xml",
  html: "html",
  markdown: "markdown",
  javascript: "javascript",
  css: "css",
  image: "xml",
  text: "plaintext",
  binary: "plaintext",
};

/** The editor language for a body format. */
export function editorLanguageFor(format: ResponseBodyFormat): CodeEditorLanguage {
  return LANGUAGES_BY_FORMAT[format];
}
