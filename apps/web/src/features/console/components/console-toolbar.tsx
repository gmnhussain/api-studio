"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CONSOLE_LEVELS } from "../console.constants";
import { useConsoleStore } from "../stores/console.store";

/** The console's header tools: which levels to show, and clearing it. */
export function ConsoleToolbar() {
  const t = useTranslations("console");
  const minimumLevel = useConsoleStore((state) => state.minimumLevel);
  const setMinimumLevel = useConsoleStore((state) => state.setMinimumLevel);
  const clear = useConsoleStore((state) => state.clear);
  const hasEntries = useConsoleStore((state) => state.entries.length > 0);
  const items = CONSOLE_LEVELS.map((level) => ({ value: level, label: t(`filters.${level}`) }));

  return (
    <>
      <Select
        items={items}
        value={minimumLevel}
        onValueChange={(value) => {
          const level = CONSOLE_LEVELS.find((candidate) => candidate === value);
          if (level) setMinimumLevel(level);
        }}
      >
        <SelectTrigger size="sm" aria-label={t("filterLabel")} className="h-6 border-none text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="end">
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value} className="text-xs">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={clear}
        disabled={!hasEntries}
        aria-label={t("clear")}
      >
        <Trash2 aria-hidden />
      </Button>
    </>
  );
}
