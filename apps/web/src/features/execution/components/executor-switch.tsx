"use client";

import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { EXECUTOR_IDS } from "@api-studio/core";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useExecutorPreference } from "../hooks/use-executor-preference";

/**
 * Picks how requests are sent, in the status bar (layout-and-interaction.md#shell): through the
 * proxy, which sends exactly what was written, or straight from the browser for local APIs a
 * hosted proxy cannot reach.
 */
export function ExecutorSwitch() {
  const t = useTranslations("shell.statusBar");
  const [executorId, setExecutorId] = useExecutorPreference();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("executorLabel", { executor: t(`executors.${executorId}`) })}
        className="flex h-5 items-center gap-1 rounded-sm px-1 hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {t(`executors.${executorId}`)}
        <ChevronUp aria-hidden className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-44">
        <DropdownMenuLabel>{t("executor")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={executorId}
          onValueChange={(value) => {
            const next = EXECUTOR_IDS.find((id) => id === value);
            if (next) setExecutorId(next);
          }}
        >
          {EXECUTOR_IDS.map((id) => (
            <DropdownMenuRadioItem key={id} value={id}>
              {t(`executors.${id}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
