import { create } from "zustand";

import type { ResponseCookie, WorkspaceId } from "@api-studio/core";

export type CookieJarState = {
  /** The workspace whose jar is loaded. */
  workspaceId: WorkspaceId | null;
  cookies: ResponseCookie[];
};

export type CookieJarActions = {
  setJar: (workspaceId: WorkspaceId, cookies: readonly ResponseCookie[]) => void;
};

/** Initial state, exported so tests can reset the store between cases. */
export function getInitialCookieJarState(): CookieJarState {
  return { workspaceId: null, cookies: [] };
}

/** The open workspace's cookie jar (F-06); the execution service keeps it in IndexedDB. */
export const useCookieJarStore = create<CookieJarState & CookieJarActions>()((set) => ({
  ...getInitialCookieJarState(),
  setJar: (workspaceId, cookies) => {
    set({ workspaceId, cookies: [...cookies] });
  },
}));
