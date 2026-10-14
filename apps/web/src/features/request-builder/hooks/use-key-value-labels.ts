"use client";

import { useTranslations } from "next-intl";

import type { KeyValueTableLabels } from "@/components/common/key-value-table/key-value-table-labels";

/** The words of every request table, from the `requestBuilder.table` catalog. */
export function useKeyValueLabels(): KeyValueTableLabels {
  const t = useTranslations("requestBuilder.table");
  return {
    key: t("key"),
    value: t("value"),
    description: t("description"),
    enabled: t("enabled"),
    actions: t("actions"),
    keyPlaceholder: t("keyPlaceholder"),
    valuePlaceholder: t("valuePlaceholder"),
    descriptionPlaceholder: t("descriptionPlaceholder"),
    newKey: t("newKey"),
    newValue: t("newValue"),
    newDescription: t("newDescription"),
    untitledRow: t("untitledRow"),
    enableRow: (row) => t("enableRow", { row }),
    keyOf: (row) => t("keyOf", { row }),
    valueOf: (row) => t("valueOf", { row }),
    descriptionOf: (row) => t("descriptionOf", { row }),
    removeRow: (row) => t("removeRow", { row }),
  };
}
