import { getMediaTypeEssence, type ResponseBody } from "@api-studio/core";

/** An image media type safe to put in a data URL: no parameters, quotes or commas. */
const IMAGE_MEDIA_TYPE_PATTERN = /^image\/[\w.+-]+$/;

/**
 * A data URL that shows an image body in an `<img>`, or `null` when the body is not an image.
 * An image element never runs scripts or loads what an SVG references, so any image is safe.
 */
export function imageDataUrl(body: ResponseBody): string | null {
  const mediaType = getMediaTypeEssence(body.contentType);
  if (mediaType === null || !IMAGE_MEDIA_TYPE_PATTERN.test(mediaType)) return null;
  return body.encoding === "base64"
    ? `data:${mediaType};base64,${body.data}`
    : `data:${mediaType};charset=utf-8,${encodeURIComponent(body.data)}`;
}

/**
 * What an HTML preview may load: nothing from the network (no tracking pixels, no requests on
 * the user's behalf), inline styles and embedded `data:` media only. Scripts are already off
 * in the sandbox; the policy blocks them a second time (request-execution.md#security).
 */
export const HTML_PREVIEW_CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "img-src data:",
  "font-src data:",
  "media-src data:",
].join("; ");

const DOCTYPE_PATTERN = /^\s*<!doctype[^>]*>/i;

/**
 * The document an HTML preview shows: the body with the content security policy, the app's
 * colour scheme (so unstyled pages match the theme) and links that cannot navigate the preview,
 * placed before anything else so the parser puts them first in `<head>`.
 */
export function buildHtmlPreviewDocument(html: string, colorScheme: "dark" | "light"): string {
  const preamble = [
    `<meta http-equiv="Content-Security-Policy" content="${HTML_PREVIEW_CONTENT_SECURITY_POLICY}">`,
    `<meta name="color-scheme" content="${colorScheme}">`,
    '<base target="_blank">',
  ].join("");
  const doctype = DOCTYPE_PATTERN.exec(html)?.[0];
  return doctype === undefined
    ? `${preamble}${html}`
    : `${doctype}${preamble}${html.slice(doctype.length)}`;
}
