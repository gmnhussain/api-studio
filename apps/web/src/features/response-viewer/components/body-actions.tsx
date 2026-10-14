"use client";

import { Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toast } from "sonner";

import type { ResponseSnapshot } from "@api-studio/core";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { copyToClipboard } from "@/lib/clipboard";

import { downloadResponseBody } from "../lib/download-response-body";

/** An icon button whose name is also its tooltip. */
function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
            className="text-muted-foreground hover:text-foreground"
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Props for {@link BodyActions}. */
export type BodyActionsProps = { response: ResponseSnapshot };

/** Copy (text bodies) and download (every body), as received (F-16). */
export function BodyActions({ response }: BodyActionsProps) {
  const t = useTranslations("responseViewer.body");
  const canCopy = response.body.encoding === "text";

  return (
    <div className="flex items-center gap-0.5">
      {canCopy ? (
        <ActionButton
          label={t("copy")}
          icon={<Copy aria-hidden />}
          onClick={() => {
            void copyToClipboard(response.body.data).then((copied) => {
              if (copied) toast.success(t("copied"));
              else toast.error(t("copyFailed"));
            });
          }}
        />
      ) : null}
      <ActionButton
        label={t("download")}
        icon={<Download aria-hidden />}
        onClick={() => {
          downloadResponseBody(response);
        }}
      />
    </div>
  );
}
