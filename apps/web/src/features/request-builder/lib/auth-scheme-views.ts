import type { ComponentType } from "react";

import { createRegistry, type AuthConfig, type AuthType, type VariableMap } from "@api-studio/core";

import type { InheritedAuth } from "../hooks/use-inherited-auth";

/** Props every auth form receives; a form edits only the fields of its own scheme. */
export type AuthFormProps = {
  auth: AuthConfig;
  onAuthChange: (auth: AuthConfig) => void;
  variables: VariableMap;
  inherited: InheritedAuth;
};

/**
 * What an auth scheme contributes to the auth editor (extensibility.md#registries): a fresh
 * configuration when the user picks it, and its form (`null` when it has no fields). How the
 * scheme is applied on send lives in core (`applyAuth`).
 */
export type AuthSchemeView = {
  readonly id: AuthType;
  create: () => AuthConfig;
  Form: ComponentType<AuthFormProps> | null;
};

/** The auth schemes the editor offers, in registration order. */
export const authSchemeViews = createRegistry<AuthSchemeView>("Auth schemes");
