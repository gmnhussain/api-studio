import { BodyNotice } from "./body-notice";
import { FormBodyEditor } from "./form-body-editor";
import { TextBodyEditor } from "./text-body-editor";
import { bodyFields, bodyText, createFormDataEntry } from "../../lib/body-conversion";
import type { BodyTypeView } from "../../lib/body-type-views";

/** The body types of v0.1 (F-08), in the order the editor lists them. */
export const BUILT_IN_BODY_TYPES: readonly BodyTypeView[] = [
  { id: "none", convert: () => ({ type: "none" }), Editor: BodyNotice },
  {
    id: "json",
    convert: (previous) => ({ type: "json", text: bodyText(previous) }),
    Editor: TextBodyEditor,
  },
  {
    id: "text",
    convert: (previous) => ({ type: "text", text: bodyText(previous) }),
    Editor: TextBodyEditor,
  },
  {
    id: "xml",
    convert: (previous) => ({ type: "xml", text: bodyText(previous) }),
    Editor: TextBodyEditor,
  },
  {
    id: "form_data",
    convert: (previous) => ({
      type: "form_data",
      entries: bodyFields(previous).map((field) => ({ ...createFormDataEntry(), ...field })),
    }),
    Editor: FormBodyEditor,
  },
  {
    id: "url_encoded",
    convert: (previous) => ({ type: "url_encoded", entries: bodyFields(previous) }),
    Editor: FormBodyEditor,
  },
  { id: "binary", convert: () => ({ type: "binary", fileName: null }), Editor: BodyNotice },
];
