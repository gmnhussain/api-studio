"use client";

import { useTranslations } from "next-intl";

import { AuthField } from "./auth-field";
import type { AuthFormProps } from "../../lib/auth-scheme-views";

/** A bearer token and the prefix written before it (`Bearer` by default). */
export function BearerAuthForm({ auth, onAuthChange, variables }: AuthFormProps) {
  const t = useTranslations("requestBuilder.auth");
  if (auth.type !== "bearer") return null;

  return (
    <>
      <AuthField
        label={t("token")}
        value={auth.token}
        onValueChange={(token) => {
          onAuthChange({ ...auth, token });
        }}
        variables={variables}
        isSecret
      />
      <AuthField
        label={t("prefix")}
        value={auth.prefix}
        onValueChange={(prefix) => {
          onAuthChange({ ...auth, prefix });
        }}
        variables={variables}
      />
    </>
  );
}
