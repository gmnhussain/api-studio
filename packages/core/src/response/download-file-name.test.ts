import { describe, expect, it } from "vitest";

import {
  extensionForContentType,
  parseContentDispositionFileName,
  sanitizeFileName,
  suggestDownloadFileName,
} from "./download-file-name";

describe("parseContentDispositionFileName", () => {
  it("reads plain and quoted file names", () => {
    expect(parseContentDispositionFileName("attachment; filename=report.pdf")).toBe("report.pdf");
    expect(parseContentDispositionFileName('attachment; filename="my \\"best\\" file.txt"')).toBe(
      'my "best" file.txt',
    );
  });

  it("prefers the RFC 8187 name and decodes it", () => {
    expect(
      parseContentDispositionFileName(
        "attachment; filename=\"fallback.txt\"; filename*=UTF-8''na%C3%AFve%20file.txt",
      ),
    ).toBe("naïve file.txt");
    expect(parseContentDispositionFileName("attachment; FILENAME*=iso-8859-1'en'caf%E9.txt")).toBe(
      "café.txt",
    );
  });

  it("falls back to the plain name when the extended one is malformed", () => {
    expect(
      parseContentDispositionFileName(
        "attachment; filename*=UTF-8''bad%E0%A4%A; filename=plain.txt",
      ),
    ).toBe("plain.txt");
  });

  it("is null without a file name", () => {
    expect(parseContentDispositionFileName("inline")).toBeNull();
    expect(parseContentDispositionFileName('attachment; filename=""')).toBeNull();
  });
});

describe("sanitizeFileName", () => {
  it("drops directories and replaces reserved and control characters", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("C:\\Windows\\win.ini")).toBe("win.ini");
    expect(sanitizeFileName('a<b>c:"d|e?f*g\u0001.txt')).toBe("a_b_c__d_e_f_g_.txt");
  });

  it("trims dots and spaces, and guards device names", () => {
    expect(sanitizeFileName("  .hidden.  ")).toBe("hidden");
    expect(sanitizeFileName("CON.txt")).toBe("_CON.txt");
    expect(sanitizeFileName("...")).toBeNull();
  });

  it("shortens very long names but keeps the extension", () => {
    const name = sanitizeFileName(`${"a".repeat(300)}.json`);
    expect(name).toHaveLength(200);
    expect(name?.endsWith(".json")).toBe(true);
  });
});

describe("extensionForContentType", () => {
  it.each([
    ["application/json; charset=utf-8", "json"],
    ["application/vnd.api+json", "json"],
    ["application/rss+xml", "xml"],
    ["image/jpeg", "jpg"],
    ["text/x-custom", "txt"],
    ["application/x-unknown", null],
    [null, null],
  ] as const)("maps %s to %s", (contentType, extension) => {
    expect(extensionForContentType(contentType)).toBe(extension);
  });
});

describe("suggestDownloadFileName", () => {
  const body = {
    encoding: "text",
    data: "{}",
    contentType: "application/json",
    truncated: false,
  } as const;

  it("uses Content-Disposition first", () => {
    expect(
      suggestDownloadFileName({
        url: "https://api.example/users",
        headers: [{ name: "Content-Disposition", value: 'attachment; filename="users.csv"' }],
        body,
      } as const),
    ).toBe("users.csv");
  });

  it("uses the URL's last segment, adding an extension from the type", () => {
    expect(
      suggestDownloadFileName({ url: "https://api.example/v1/users", headers: [], body }),
    ).toBe("users.json");
    expect(
      suggestDownloadFileName({ url: "https://cdn.example/a%20b.png?x=1", headers: [], body }),
    ).toBe("a b.png");
  });

  it("falls back to 'response'", () => {
    expect(suggestDownloadFileName({ url: "https://api.example/", headers: [], body })).toBe(
      "response.json",
    );
    expect(
      suggestDownloadFileName({
        url: "not a url",
        headers: [],
        body: { ...body, contentType: null },
      } as const),
    ).toBe("response");
  });
});
