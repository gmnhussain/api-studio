"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import {
  detectBodyFormat,
  formatBytes,
  getMediaTypeEssence,
  type ResponseSnapshot,
  type TabId,
} from "@api-studio/core";

import { SegmentedControl } from "@/components/common/segmented-control";
import { Button } from "@/components/ui/button";

import { BodyActions } from "./body-actions";
import { BodyNotice } from "./body-notice";
import { downloadResponseBody } from "../lib/download-response-body";
import { pickViewer, viewersFor } from "../lib/response-viewers";
import { useResponseViewerStore } from "../stores/response-viewer.store";

/** Props for {@link ResponseBody}. */
export type ResponseBodyProps = { tabId: TabId; response: ResponseSnapshot };

/**
 * The body section (F-12): the views that can show this body (pretty, tree, raw, preview), the
 * one picked for the tab or the best default, and copy / download.
 */
export function ResponseBody({ tabId, response }: ResponseBodyProps) {
  const t = useTranslations("responseViewer");
  const labelId = useId();
  const preferredId = useResponseViewerStore((state) => state.views[tabId]?.viewerId ?? null);
  const setViewer = useResponseViewerStore((state) => state.setViewer);
  const format = detectBodyFormat(response.body);
  const viewers = viewersFor(format, response);
  const viewer = pickViewer(viewers, preferredId);

  if (response.body.data === "") return <BodyNotice>{t("emptyBody")}</BodyNotice>;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
        <span id={labelId} className="sr-only">
          {t("body.viewLabel")}
        </span>
        {viewer && viewers.length > 1 ? (
          <SegmentedControl
            value={viewer.id}
            options={viewers.map((option) => ({
              value: option.id,
              label: t(`viewers.${option.label}`),
            }))}
            onValueChange={(viewerId) => {
              setViewer(tabId, viewerId);
            }}
            aria-labelledby={labelId}
          />
        ) : null}
        <div className="ml-auto">
          <BodyActions response={response} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {viewer ? (
          <viewer.View response={response} format={format} />
        ) : (
          <BodyNotice
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  downloadResponseBody(response);
                }}
              >
                <Download aria-hidden />
                {t("body.download")}
              </Button>
            }
          >
            {t("binaryBody", {
              type: getMediaTypeEssence(response.body.contentType) ?? t("unknownType"),
              size: formatBytes(response.sizes.decodedBodyBytes),
            })}
          </BodyNotice>
        )}
      </div>
    </div>
  );
}
