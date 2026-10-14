import type { ComponentType } from "react";

import {
  createRegistry,
  type BodyType,
  type RequestBody,
  type VariableMap,
} from "@api-studio/core";

/** Props every body editor receives; an editor handles only its own body type. */
export type BodyEditorProps = {
  body: RequestBody;
  onBodyChange: (body: RequestBody) => void;
  variables: VariableMap;
};

/**
 * What a body type contributes to the body editor (extensibility.md#registries): how to switch
 * to it from the current body, keeping what still fits, and its editor. Serialization on send
 * lives in core (`serializeBody`).
 */
export type BodyTypeView = {
  readonly id: BodyType;
  /** The body after switching to this type from `previous`. */
  convert: (previous: RequestBody) => RequestBody;
  Editor: ComponentType<BodyEditorProps>;
};

/** The body types the editor offers, in registration order. */
export const bodyTypeViews = createRegistry<BodyTypeView>("Body types");
