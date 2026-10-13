import { createChangeFeed, type ChangeFeed } from "./change-feed";

let sharedChangeFeed: ChangeFeed | undefined;

/**
 * The one change feed of this browser tab. Every repository publishes on it and every service
 * listens on it: a `BroadcastChannel` delivers to every other channel object, in this tab too,
 * so separate feeds per feature would make a tab re-read its own writes.
 */
export function getSharedChangeFeed(): ChangeFeed {
  sharedChangeFeed ??= createChangeFeed();
  return sharedChangeFeed;
}
