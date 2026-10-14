"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import { OAUTH2_GRANT_TYPES } from "@api-studio/core";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AuthField } from "./auth-field";
import type { AuthFormProps } from "../../lib/auth-scheme-views";

/**
 * OAuth 2.0 configuration and a pasted access token, sent as a bearer token. The token flow
 * itself arrives in v0.2; the configuration is kept for it.
 */
export function OAuth2AuthForm({ auth, onAuthChange, variables }: AuthFormProps) {
  const t = useTranslations("requestBuilder.auth");
  const grantTypeLabelId = useId();
  if (auth.type !== "oauth2") return null;

  const grantTypes = OAUTH2_GRANT_TYPES.map((grantType) => ({
    value: grantType,
    label: t(`grantTypes.${grantType}`),
  }));

  return (
    <>
      <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-3">
        <span id={grantTypeLabelId} className="text-xs text-muted-foreground">
          {t("grantType")}
        </span>
        <Select
          items={grantTypes}
          value={auth.grantType}
          onValueChange={(value) => {
            const grantType = OAUTH2_GRANT_TYPES.find((option) => option === value);
            if (grantType) onAuthChange({ ...auth, grantType });
          }}
        >
          <SelectTrigger aria-labelledby={grantTypeLabelId} className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {grantTypes.map((grantType) => (
              <SelectItem key={grantType.value} value={grantType.value}>
                {grantType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <AuthField
        label={t("accessTokenUrl")}
        value={auth.accessTokenUrl}
        onValueChange={(accessTokenUrl) => {
          onAuthChange({ ...auth, accessTokenUrl });
        }}
        variables={variables}
      />
      <AuthField
        label={t("clientId")}
        value={auth.clientId}
        onValueChange={(clientId) => {
          onAuthChange({ ...auth, clientId });
        }}
        variables={variables}
      />
      <AuthField
        label={t("clientSecret")}
        value={auth.clientSecret}
        onValueChange={(clientSecret) => {
          onAuthChange({ ...auth, clientSecret });
        }}
        variables={variables}
        isSecret
      />
      <AuthField
        label={t("scope")}
        value={auth.scope}
        onValueChange={(scope) => {
          onAuthChange({ ...auth, scope });
        }}
        variables={variables}
      />
      <AuthField
        label={t("accessToken")}
        value={auth.accessToken}
        onValueChange={(accessToken) => {
          onAuthChange({ ...auth, accessToken });
        }}
        variables={variables}
        isSecret
      />
    </>
  );
}
