import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ResponseBody, ResponseSnapshot } from "@api-studio/core";

import { renderWithProviders } from "@test/render-with-providers";

import { HtmlPreview } from "./html-preview";
import { ImagePreview } from "./image-preview";
import { MarkdownPreview } from "./markdown-preview";

function responseWith(body: ResponseBody): ResponseSnapshot {
  return {
    status: 200,
    statusText: "OK",
    url: "https://api.example/doc",
    headers: [],
    cookies: [],
    body,
    sizes: { requestBytes: 0, responseHeadersBytes: 0, responseBodyBytes: 3, decodedBodyBytes: 3 },
    timings: {
      startedAt: "2026-10-14T10:00:00.000Z",
      timeToFirstByteMilliseconds: 1,
      downloadMilliseconds: 1,
      totalMilliseconds: 2,
    },
    redirects: [],
    httpVersion: "1.1",
  };
}

describe("HtmlPreview", () => {
  it("renders into a fully sandboxed frame that loads nothing from the network", () => {
    renderWithProviders(
      <HtmlPreview
        format="html"
        response={responseWith({
          encoding: "text",
          data: "<h1>Hello</h1><script>parent.alert(1)</script>",
          contentType: "text/html",
          truncated: false,
        })}
      />,
    );
    const frame = screen.getByTitle("HTML preview of the response");
    expect(frame).toHaveAttribute("sandbox", "");
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
    const source = frame.getAttribute("srcdoc") ?? "";
    expect(source).toContain("default-src 'none'");
    expect(source).toContain('<meta name="color-scheme" content="light">');
  });
});

describe("ImagePreview", () => {
  it("shows the image from the body itself, with its type and size", () => {
    renderWithProviders(
      <ImagePreview
        format="image"
        response={responseWith({
          encoding: "base64",
          data: "AQID",
          contentType: "image/png",
          truncated: false,
        })}
      />,
    );
    expect(screen.getByRole("img", { name: "The response image" })).toHaveAttribute(
      "src",
      "data:image/png;base64,AQID",
    );
    expect(screen.getByText("image/png · 3 B")).toBeInTheDocument();
  });
});

describe("MarkdownPreview", () => {
  const markdown = [
    "# Title",
    "",
    "Some **bold** text and [a link](https://example.com) and [bad](javascript:alert(1)).",
    "",
    "<img src=x onerror=alert(1)>",
    "",
    "![logo](https://cdn.example/logo.png)",
    "",
    "| a | b |",
    "| - | - |",
    "| 1 | 2 |",
  ].join("\n");

  it("renders GitHub-flavoured Markdown safely", () => {
    const { container } = renderWithProviders(
      <MarkdownPreview
        format="markdown"
        response={responseWith({
          encoding: "text",
          data: markdown,
          contentType: "text/markdown",
          truncated: false,
        })}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "a link" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("bad").closest("a")?.getAttribute("href")).toBe("");

    // Raw HTML is shown as text, and remote images are links, never loaded.
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("link", { name: "Image: logo" })).toHaveAttribute(
      "href",
      "https://cdn.example/logo.png",
    );
  });
});
