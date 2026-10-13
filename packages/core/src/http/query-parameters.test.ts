import { describe, expect, it } from "vitest";

import {
  buildUrlFromQueryParameters,
  formatQueryString,
  parseQueryString,
  syncQueryParametersFromUrl,
} from "./query-parameters";
import { joinUrl, splitUrl } from "./url-parts";
import { createKeyValueEntry } from "../models/model-factories";

describe("splitUrl and joinUrl", () => {
  it.each([
    ["https://api.example.com/users", "https://api.example.com/users", null, null],
    ["{{baseUrl}}/users?limit=10", "{{baseUrl}}/users", "limit=10", null],
    ["/search?q=a?b#top", "/search", "q=a?b", "top"],
    ["https://x.dev/#/route?tab=1", "https://x.dev/", null, "/route?tab=1"],
    ["https://x.dev/?", "https://x.dev/", "", null],
    ["", "", null, null],
  ])("splits %j", (url, base, query, fragment) => {
    const parts = splitUrl(url);

    expect(parts).toEqual({ base, query, fragment });
    expect(joinUrl(parts)).toBe(url);
  });
});

describe("parseQueryString and formatQueryString", () => {
  it("keeps keys and values exactly as written", () => {
    expect(parseQueryString("q=caf%C3%A9&tags=a,b&empty=&flag&x={{token}}")).toEqual([
      { key: "q", value: "caf%C3%A9" },
      { key: "tags", value: "a,b" },
      { key: "empty", value: "" },
      { key: "flag", value: "" },
      { key: "x", value: "{{token}}" },
    ]);
  });

  it("splits only at the first equals sign and skips empty segments", () => {
    expect(parseQueryString("filter=a=b&&page=2&")).toEqual([
      { key: "filter", value: "a=b" },
      { key: "page", value: "2" },
    ]);
  });

  it("writes a key without a value as just the key", () => {
    expect(
      formatQueryString([
        { key: "flag", value: "" },
        { key: "page", value: "2" },
      ]),
    ).toBe("flag&page=2");
  });
});

describe("syncQueryParametersFromUrl", () => {
  it("creates rows for the URL's pairs", () => {
    const rows = syncQueryParametersFromUrl("https://x.dev?limit=10&sort=name", []);

    expect(rows.map(({ key, value, enabled }) => ({ key, value, enabled }))).toEqual([
      { key: "limit", value: "10", enabled: true },
      { key: "sort", value: "name", enabled: true },
    ]);
  });

  it("keeps row ids and descriptions while the user types", () => {
    const limit = createKeyValueEntry({ key: "limit", value: "1", description: "Page size" });

    const [updated] = syncQueryParametersFromUrl("https://x.dev?limit=10", [limit]);

    expect(updated).toEqual({ ...limit, value: "10" });
  });

  it("returns the same row object when nothing changed", () => {
    const limit = createKeyValueEntry({ key: "limit", value: "10" });

    expect(syncQueryParametersFromUrl("https://x.dev?limit=10", [limit])[0]).toBe(limit);
  });

  it("keeps disabled rows in place and out of the URL pairing", () => {
    const debug = createKeyValueEntry({ key: "debug", value: "1", enabled: false });
    const page = createKeyValueEntry({ key: "page", value: "1" });

    const rows = syncQueryParametersFromUrl("https://x.dev?page=2", [debug, page]);

    expect(rows).toEqual([debug, { ...page, value: "2" }]);
  });

  it("removes enabled rows whose pair was deleted from the URL", () => {
    const rows = syncQueryParametersFromUrl("https://x.dev", [
      createKeyValueEntry({ key: "page", value: "2" }),
    ]);

    expect(rows).toEqual([]);
  });
});

describe("buildUrlFromQueryParameters", () => {
  it("writes enabled rows with a key, in order, and keeps the fragment", () => {
    const url = buildUrlFromQueryParameters("{{baseUrl}}/users?old=1#section", [
      createKeyValueEntry({ key: "limit", value: "10" }),
      createKeyValueEntry({ key: "debug", value: "1", enabled: false }),
      createKeyValueEntry({ key: "", value: "orphan" }),
      createKeyValueEntry({ key: "sort", value: "" }),
    ]);

    expect(url).toBe("{{baseUrl}}/users?limit=10&sort#section");
  });

  it("drops the ? when no row remains", () => {
    expect(buildUrlFromQueryParameters("https://x.dev/users?page=2", [])).toBe(
      "https://x.dev/users",
    );
  });

  it("round-trips with syncQueryParametersFromUrl", () => {
    const url = "https://x.dev/a?b=1&c&d=%20x#e";

    expect(buildUrlFromQueryParameters(url, syncQueryParametersFromUrl(url, []))).toBe(url);
  });
});
