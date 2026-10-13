import { describe, expect, it } from "vitest";

import { formatBytes, formatDuration } from "./format";
import { getStatusClass } from "./status";

describe("getStatusClass", () => {
  it.each([
    [100, "informational"],
    [200, "success"],
    [204, "success"],
    [301, "redirection"],
    [404, "client_error"],
    [503, "server_error"],
    [599, "server_error"],
    [99, "unknown"],
    [600, "unknown"],
    [200.5, "unknown"],
  ])("classifies %s as %s", (status, statusClass) => {
    expect(getStatusClass(status)).toBe(statusClass);
  });
});

describe("formatBytes", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1023, "1023 B"],
    [1024, "1.0 KB"],
    [3482, "3.4 KB"],
    [15_360, "15 KB"],
    [1_153_434, "1.1 MB"],
    [5 * 1024 ** 3, "5.0 GB"],
    [-5, "0 B"],
  ])("formats %s as %s", (bytes, text) => {
    expect(formatBytes(bytes)).toBe(text);
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0 ms"],
    [142.4, "142 ms"],
    [999, "999 ms"],
    [1200, "1.2 s"],
    [12_400, "12 s"],
    [60_000, "1 min"],
    [125_000, "2 min 5 s"],
    [-1, "0 ms"],
  ])("formats %s as %s", (milliseconds, text) => {
    expect(formatDuration(milliseconds)).toBe(text);
  });
});
