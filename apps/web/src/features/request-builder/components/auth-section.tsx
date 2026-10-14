"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import type { AuthConfig, VariableMap } from "@api-studio/core";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { InheritedAuth } from "../hooks/use-inherited-auth";
import { authSchemeViews } from "../lib/auth-scheme-views";

/** Props for {@link AuthSection}. */
export type AuthSectionProps = {
  auth: AuthConfig;
  onAuthChange: (auth: AuthConfig) => void;
  inherited: InheritedAuth;
  variables: VariableMap;
};

/**
 * The auth editor (F-07): a scheme picker and the form the scheme contributes. Schemes come from
 * the auth scheme registry, so a new one is a contribution, not a change here.
 */
export function AuthSection({ auth, onAuthChange, inherited, variables }: AuthSectionProps) {
  const t = useTranslations("requestBuilder.auth");
  const typeLabelId = useId();
  const schemes = authSchemeViews.list();
  const Form = authSchemeViews.get(auth.type)?.Form ?? null;
  const items = schemes.map((scheme) => ({ value: scheme.id, label: t(`types.${scheme.id}`) }));

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-3">
        <span id={typeLabelId} className="text-xs text-muted-foreground">
          {t("typeLabel")}
        </span>
        <Select
          items={items}
          value={auth.type}
          onValueChange={(value) => {
            const scheme = schemes.find((candidate) => candidate.id === value);
            if (scheme) onAuthChange(scheme.create());
          }}
        >
          <SelectTrigger aria-labelledby={typeLabelId} className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">{t(`descriptions.${auth.type}`)}</p>
      {Form ? (
        <Form auth={auth} onAuthChange={onAuthChange} variables={variables} inherited={inherited} />
      ) : null}
    </div>
  );
}
