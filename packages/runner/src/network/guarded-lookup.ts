import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from "node:dns";

import { isPrivateAddress } from "./address-policy";

/** Raised when a host resolves to an address the policy refuses. */
export class BlockedAddressError extends Error {
  readonly code = "BLOCKED_ADDRESS";

  /** @param address The refused address. */
  constructor(readonly address: string) {
    super(`Connecting to ${address} is not allowed`);
    this.name = "BlockedAddressError";
  }
}

/** The callback `net.connect` passes to a custom `lookup`. */
type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

/**
 * A `lookup` for socket connections that refuses addresses the policy blocks. Checking the
 * address the socket actually connects to, after DNS, defeats DNS rebinding: a name cannot
 * pass a check and then resolve somewhere else (request-execution.md#security).
 */
export function createGuardedLookup({ allowPrivateNetworks }: { allowPrivateNetworks: boolean }) {
  return (hostname: string, options: LookupOptions, callback: LookupCallback): void => {
    dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
      if (error) {
        callback(error, []);
        return;
      }
      const blocked = allowPrivateNetworks
        ? undefined
        : addresses.find((entry) => isPrivateAddress(entry.address));
      if (blocked) {
        callback(new BlockedAddressError(blocked.address), []);
        return;
      }
      if (options.all === true) {
        callback(null, addresses);
        return;
      }
      const [first] = addresses;
      if (!first) {
        callback(Object.assign(new Error(`No address for ${hostname}`), { code: "ENOTFOUND" }), []);
        return;
      }
      callback(null, first.address, first.family);
    });
  };
}
