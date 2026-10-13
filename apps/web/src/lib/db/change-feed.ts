import type { TableName } from "./database";

/** Name of the channel that carries data changes between browser tabs. */
export const CHANGE_FEED_CHANNEL = "api-studio.data-changes";

/** Records that were written or deleted in one table. */
export type DataChange = { table: TableName; ids: readonly string[] };

export type ChangeFeed = {
  /** Tells other tabs that records changed. The sending tab does not receive its own change. */
  publish: (change: DataChange) => void;
  /** Calls `listener` for every change another tab publishes; returns an unsubscribe function. */
  subscribe: (listener: (change: DataChange) => void) => () => void;
  close: () => void;
};

function isDataChange(value: unknown): value is DataChange {
  return (
    typeof value === "object" &&
    value !== null &&
    "table" in value &&
    typeof value.table === "string" &&
    "ids" in value &&
    Array.isArray(value.ids)
  );
}

/**
 * Keeps tabs of the same workspace consistent (state-management.md#cross-tab-consistency):
 * repositories publish after each write, and services re-read the changed records. Messages that
 * do not look like a change are ignored.
 */
export function createChangeFeed(channelName: string = CHANGE_FEED_CHANNEL): ChangeFeed {
  const channel = new BroadcastChannel(channelName);
  return {
    publish: (change) => {
      channel.postMessage(change);
    },
    subscribe: (listener) => {
      const handleMessage = (event: MessageEvent<unknown>) => {
        if (isDataChange(event.data)) listener(event.data);
      };
      channel.addEventListener("message", handleMessage);
      return () => {
        channel.removeEventListener("message", handleMessage);
      };
    },
    close: () => {
      channel.close();
    },
  };
}
