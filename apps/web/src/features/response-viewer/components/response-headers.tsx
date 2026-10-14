"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { HeaderPair } from "@api-studio/core";

import { BodyNotice } from "./body-notice";
import { SectionFilter } from "./section-filter";
import { matchesTextFilter } from "../lib/text-filter";

/** Props for {@link ResponseHeaders}. */
export type ResponseHeadersProps = { headers: readonly HeaderPair[] };

/** The response headers as received, in order, filterable by name or value (F-15). */
export function ResponseHeaders({ headers }: ResponseHeadersProps) {
  const t = useTranslations("responseViewer.headers");
  const [filter, setFilter] = useState("");
  const shown = headers.filter((header) => matchesTextFilter(filter, [header.name, header.value]));

  if (headers.length === 0) return <BodyNotice>{t("none")}</BodyNotice>;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionFilter
        value={filter}
        onValueChange={setFilter}
        placeholder={t("filter")}
        summary={t("shown", { shown: shown.length, total: headers.length })}
      />
      {shown.length === 0 ? (
        <BodyNotice>{t("noMatches")}</BodyNotice>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full table-fixed border-collapse text-xs">
            <thead className="sticky top-0 bg-surface text-start text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="w-2/5 px-3 py-1.5 text-start font-medium">
                  {t("name")}
                </th>
                <th scope="col" className="px-3 py-1.5 text-start font-medium">
                  {t("value")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono">
              {shown.map((header, index) => (
                <tr key={`${header.name}-${String(index)}`} className="align-top">
                  <td className="px-3 py-1.5 break-all text-muted-foreground">{header.name}</td>
                  <td className="px-3 py-1.5 break-all select-text">{header.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
