import { describe, expect, it } from "vitest";

import {
  buildHtmlPreviewDocument,
  HTML_PREVIEW_CONTENT_SECURITY_POLICY,
  imageDataUrl,
} from "./preview-sources";

describe("imageDataUrl", () => {
  it("embeds base64 images and percent-encodes SVG text", () => {
    expect(
      imageDataUrl({
        encoding: "base64",
        data: "AQID",
        contentType: "image/png",
        truncated: false,
      }),
    ).toBe("data:image/png;base64,AQID");
    expect(
      imageDataUrl({
        encoding: "text",
        data: '<svg xmlns="http://www.w3.org/2000/svg"/>',
        contentType: "image/svg+xml; charset=utf-8",
        truncated: false,
      }),
    ).toBe(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>')}`,
    );
  });

  it("refuses bodies that are not images or whose type could break the URL", () => {
    const body = { encoding: "base64", data: "AQID", truncated: false } as const;
    expect(imageDataUrl({ ...body, contentType: "application/pdf" })).toBeNull();
    expect(imageDataUrl({ ...body, contentType: null })).toBeNull();
    expect(imageDataUrl({ ...body, contentType: "image/png,evil" })).toBeNull();
  });
});

describe("buildHtmlPreviewDocument", () => {
  it("puts the policy, colour scheme and link target first", () => {
    const document = buildHtmlPreviewDocument("<h1>Hi</h1>", "dark");
    expect(document.startsWith('<meta http-equiv="Content-Security-Policy"')).toBe(true);
    expect(document).toContain(HTML_PREVIEW_CONTENT_SECURITY_POLICY);
    expect(document).toContain('<meta name="color-scheme" content="dark">');
    expect(document).toContain('<base target="_blank">');
    expect(document.endsWith("<h1>Hi</h1>")).toBe(true);
  });

  it("keeps the doctype first, so the page stays in standards mode", () => {
    const document = buildHtmlPreviewDocument("  <!DOCTYPE html><html><p>x</p></html>", "light");
    expect(document.startsWith("  <!DOCTYPE html><meta http-equiv")).toBe(true);
    expect(document.endsWith("<html><p>x</p></html>")).toBe(true);
  });

  it("allows no network, no scripts and no frames", () => {
    expect(HTML_PREVIEW_CONTENT_SECURITY_POLICY).toContain("default-src 'none'");
    expect(HTML_PREVIEW_CONTENT_SECURITY_POLICY).not.toMatch(/script-src|https?:|\*/);
  });
});
