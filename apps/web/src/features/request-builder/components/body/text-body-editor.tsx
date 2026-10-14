"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { CodeEditor } from "@/components/common/code-editor/code-editor";
import type { CodeEditorLanguage } from "@/components/common/code-editor/code-editor-props";
import { Button } from "@/components/ui/button";

import type { BodyEditorProps } from "../../lib/body-type-views";
import { formatJson } from "../../lib/format-json";

const LANGUAGES = { json: "json", text: "plaintext", xml: "xml" } as const satisfies Record<
  string,
  CodeEditorLanguage
>;

/** A JSON, text or XML body in the code editor; JSON can be formatted. */
export function TextBodyEditor({ body, onBodyChange }: BodyEditorProps) {
  const t = useTranslations("requestBuilder.body");
  if (body.type !== "json" && body.type !== "text" && body.type !== "xml") return null;

  const format = () => {
    const formatted = formatJson(body.text);
    if (formatted.ok) onBodyChange({ ...body, text: formatted.value });
    else toast.error(t("formatFailed"));
  };

  return (
    <div className="flex h-full min-h-48 flex-col gap-2">
      {body.type === "json" ? (
        <div className="flex justify-end">
          <Button variant="ghost" size="xs" onClick={format}>
            {t("format")}
          </Button>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 rounded-md border">
        <CodeEditor
          value={body.text}
          onValueChange={(text) => {
            onBodyChange({ ...body, text });
          }}
          language={LANGUAGES[body.type]}
          aria-label={t("editorLabel", { type: t(`types.${body.type}`) })}
        />
      </div>
    </div>
  );
}
