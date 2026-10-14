import { describe, expect, it } from "vitest";

import { isPrivateAddress } from "./address-policy";

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.10",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fd12:3456::1",
    "fe80::1",
    "::ffff:10.0.0.1",
    "not an address",
  ])("blocks %s", (address) => {
    expect(isPrivateAddress(address)).toBe(true);
  });

  it.each(["93.184.215.14", "8.8.8.8", "172.32.0.1", "2606:4700::6810:84e5", "::ffff:8.8.8.8"])(
    "allows %s",
    (address) => {
      expect(isPrivateAddress(address)).toBe(false);
    },
  );
});
