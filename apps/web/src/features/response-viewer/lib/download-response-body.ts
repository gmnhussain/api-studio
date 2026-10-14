import {
  decodeResponseBody,
  getMediaTypeEssence,
  suggestDownloadFileName,
  type ResponseSnapshot,
} from "@api-studio/core";

import { downloadFile } from "@/lib/download-file";

/** The type a download is saved as when the response names none. */
const FALLBACK_MEDIA_TYPE = "application/octet-stream";

/** Saves a body exactly as received, under the name the response suggests (F-16). */
export function downloadResponseBody(response: ResponseSnapshot): void {
  const bytes = decodeResponseBody(response.body);
  const type = getMediaTypeEssence(response.body.contentType) ?? FALLBACK_MEDIA_TYPE;
  downloadFile(new Blob([bytes], { type }), suggestDownloadFileName(response));
}
