"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { formatBytes, getMediaTypeEssence } from "@api-studio/core";

import { imageDataUrl } from "../../lib/preview-sources";
import type { ResponseViewerProps } from "../../lib/response-viewers";
import { BodyNotice } from "../body-notice";

type ImageState = { status: "loading" } | { status: "loaded"; width: number; height: number };

/**
 * The image preview (F-14): the image at its natural size, scaled down to fit, on a
 * checkerboard that shows transparency, with its type, dimensions and size.
 */
export function ImagePreview({ response }: ResponseViewerProps) {
  const t = useTranslations("responseViewer.preview");
  const source = imageDataUrl(response.body);
  const [image, setImage] = useState<ImageState | { status: "failed" }>({ status: "loading" });

  if (source === null || image.status === "failed") {
    return <BodyNotice>{t("imageFailed")}</BodyNotice>;
  }
  return (
    <figure className="flex h-full min-h-0 flex-col items-center gap-2 overflow-auto p-4">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- A data URL of the response itself: there is nothing for the image optimizer to fetch. */}
        <img
          src={source}
          alt={t("imageAlt")}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            setImage({ status: "loaded", width: naturalWidth, height: naturalHeight });
          }}
          onError={() => {
            setImage({ status: "failed" });
          }}
          className="max-h-full max-w-full rounded-sm border checkerboard object-contain"
        />
      </div>
      <figcaption className="font-mono text-xs text-muted-foreground tabular-nums">
        {[
          getMediaTypeEssence(response.body.contentType),
          image.status === "loaded"
            ? t("dimensions", { width: image.width, height: image.height })
            : null,
          formatBytes(response.sizes.decodedBodyBytes),
        ]
          .filter((part) => part !== null)
          .join(" · ")}
      </figcaption>
    </figure>
  );
}
