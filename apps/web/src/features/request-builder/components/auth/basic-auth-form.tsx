"use client";

import { useTranslations } from "next-intl";

import { AuthField } from "./auth-field";
import type { AuthFormProps } from "../../lib/auth-scheme-views";

/** Username and password for Basic auth (RFC 7617). */
export function BasicAuthForm({ auth, onAuthChange, variables }: AuthFormProps) {
  const t = useTranslations("requestBuilder.auth");
  if (auth.type !== "basic") return null;

  return (
    <>
      <AuthField
        label={t("username")}
        value={auth.username}
        onValueChange={(username) => {
          onAuthChange({ ...auth, username });
        }}
        variables={variables}
      />
      <AuthField
        label={t("password")}
        value={auth.password}
        onValueChange={(password) => {
          onAuthChange({ ...auth, password });
        }}
        variables={variables}
        isSecret
      />
    </>
  );
}
