import { describe, expect, it } from "vitest";

import { detectBodyFormat, getMediaTypeEssence } from "./body-format";
import type { ResponseBody } from "../execution/execution-result.schema";

function textBody(data: string, contentType: string | null): ResponseBody {
  return { encoding: "text", data, contentType, truncated: false };
}

describe("getMediaTypeEssence", () => {
  it("drops parameters and case", () => {
    expect(getMediaTypeEssence("Application/JSON; charset=utf-8")).toBe("application/json");
  });

  it("is null without a usable type", () => {
    expect(getMediaTypeEssence(null)).toBeNull();
    expect(getMediaTypeEssence("nonsense")).toBeNull();
  });
});

describe("detectBodyFormat", () => {
  it.each([
    ["application/json", "json"],
    ["application/problem+json; charset=utf-8", "json"],
    ["text/xml", "xml"],
    ["application/atom+xml", "xml"],
    ["text/html; charset=utf-8", "html"],
    ["application/xhtml+xml", "html"],
    ["text/markdown", "markdown"],
    ["text/javascript", "javascript"],
    ["text/css", "css"],
    ["text/plain", "text"],
    ["text/csv", "text"],
  ] as const)("reads %s as %s", (contentType, format) => {
    expect(detectBodyFormat(textBody("x", contentType))).toBe(format);
  });

  it("treats every image type as an image, SVG sent as text included", () => {
    expect(detectBodyFormat(textBody("<svg/>", "image/svg+xml"))).toBe("image");
    expect(
      detectBodyFormat({
        encoding: "base64",
        data: "AA==",
        contentType: "image/png",
        truncated: false,
      }),
    ).toBe("image");
  });

  it("treats other bodies that did not arrive as text as binary", () => {
    expect(
      detectBodyFormat({
        encoding: "base64",
        data: "AA==",
        contentType: "application/json",
        truncated: false,
      }),
    ).toBe("binary");
  });

  it.each([
    ['  {"a":1}', "json"],
    [`${String.fromCodePoint(0xfeff)}[1]`, "json"],
    ["<!DOCTYPE html><html></html>", "html"],
    ["<html lang=en>", "html"],
    ['<?xml version="1.0"?><a/>', "xml"],
    ["<feed/>", "xml"],
    ["plain words", "text"],
  ] as const)("sniffs %j without a type as %s", (data, format) => {
    expect(detectBodyFormat(textBody(data, null))).toBe(format);
  });
});
