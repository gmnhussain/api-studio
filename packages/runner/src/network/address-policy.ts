import { BlockList, isIP } from "node:net";

/**
 * Address ranges a public proxy must never reach (request-execution.md#security): loopback,
 * private networks, link-local (cloud metadata lives at 169.254.169.254), carrier-grade NAT,
 * "this network", multicast and reserved space, for IPv4 and IPv6.
 */
const IPV4_BLOCKED_SUBNETS = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const;

const IPV6_BLOCKED_SUBNETS = [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const;

/** IPv4 addresses written inside IPv6 (`::ffff:10.0.0.1`), which reach the IPv4 address. */
const IPV4_MAPPED_PREFIX = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i;

const blockedAddresses = new BlockList();
for (const [network, prefix] of IPV4_BLOCKED_SUBNETS) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of IPV6_BLOCKED_SUBNETS) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

/**
 * Whether an IP address is private, loopback, link-local or otherwise not on the public
 * internet. Anything that is not a valid IP counts as private, so a mistake fails closed.
 */
export function isPrivateAddress(address: string): boolean {
  const mapped = IPV4_MAPPED_PREFIX.exec(address)?.[1];
  const candidate = mapped ?? address;
  const family = isIP(candidate);
  if (family === 0) return true;
  return blockedAddresses.check(candidate, family === 4 ? "ipv4" : "ipv6");
}
