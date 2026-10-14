"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import type { ResponseCookie } from "@api-studio/core";

import { BodyNotice } from "./body-notice";
import { SectionFilter } from "./section-filter";
import { matchesTextFilter } from "../lib/text-filter";

/** Props for {@link ResponseCookies}. */
export type ResponseCookiesProps = { cookies: readonly ResponseCookie[] };

/** `Set-Cookie` attribute names as RFC 6265 writes them; protocol terms, not UI copy. */
const COOKIE_ATTRIBUTES = { httpOnly: "HttpOnly", secure: "Secure", sameSite: "SameSite" } as const;

/** `SameSite` values as servers write them. */
const SAME_SITE_LABELS: Readonly<Record<NonNullable<ResponseCookie["sameSite"]>, string>> = {
  strict: "Strict",
  lax: "Lax",
  none: "None",
};

/** A cookie's attributes as short labels: `HttpOnly`, `Secure`, `SameSite=Lax`. */
function attributeLabels(cookie: ResponseCookie): string[] {
  const labels: string[] = [];
  if (cookie.httpOnly) labels.push(COOKIE_ATTRIBUTES.httpOnly);
  if (cookie.secure) labels.push(COOKIE_ATTRIBUTES.secure);
  if (cookie.sameSite !== null) {
    labels.push(`${COOKIE_ATTRIBUTES.sameSite}=${SAME_SITE_LABELS[cookie.sameSite]}`);
  }
  return labels;
}

/**
 * The cookies the response set (F-15), parsed from `Set-Cookie`, filterable by name, value or
 * domain. They are already in the workspace's cookie jar.
 */
export function ResponseCookies({ cookies }: ResponseCookiesProps) {
  const t = useTranslations("responseViewer.cookies");
  const format = useFormatter();
  const [filter, setFilter] = useState("");
  const shown = cookies.filter((cookie) =>
    matchesTextFilter(filter, [cookie.name, cookie.value, cookie.domain]),
  );

  if (cookies.length === 0) return <BodyNotice>{t("none")}</BodyNotice>;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionFilter
        value={filter}
        onValueChange={setFilter}
        placeholder={t("filter")}
        summary={t("shown", { shown: shown.length, total: cookies.length })}
      />
      {shown.length === 0 ? (
        <BodyNotice>{t("noMatches")}</BodyNotice>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-xl border-collapse text-xs">
            <thead className="sticky top-0 bg-surface text-muted-foreground">
              <tr className="border-b">
                {(["name", "value", "domain", "path", "expires", "attributes"] as const).map(
                  (column) => (
                    <th key={column} scope="col" className="px-3 py-1.5 text-start font-medium">
                      {t(`columns.${column}`)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((cookie) => (
                <tr key={`${cookie.domain}|${cookie.path}|${cookie.name}`} className="align-top">
                  <td className="px-3 py-1.5 font-mono break-all">{cookie.name}</td>
                  <td className="px-3 py-1.5 font-mono break-all">{cookie.value}</td>
                  <td className="px-3 py-1.5 font-mono break-all text-muted-foreground">
                    {cookie.domain}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-muted-foreground">{cookie.path}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                    {cookie.expiresAt === null
                      ? t("session")
                      : format.dateTime(new Date(cookie.expiresAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                  </td>
                  <td className="px-3 py-1.5">
                    <ul className="flex flex-wrap gap-1">
                      {attributeLabels(cookie).map((label) => (
                        <li
                          key={label}
                          className="rounded-sm bg-surface-hover px-1.5 font-mono text-muted-foreground"
                        >
                          {label}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
