import { create } from "zustand";

import type { ExecutionErrorCode, HttpMethod } from "@api-studio/core";

import { CONSOLE_ENTRY_LIMIT, type ConsoleLevel } from "../console.constants";

/** What an execution entry records: enough to read the log without opening the response. */
export type ExecutionLog = {
  method: HttpMethod;
  /** The URL as sent, with secret query values already redacted by the caller. */
  url: string;
  status: number | null;
  totalMilliseconds: number | null;
  errorCode: ExecutionErrorCode | null;
};

/** An entry before the console gives it an id: when, how serious, and what happened. */
export type NewConsoleEntry = {
  level: ConsoleLevel;
  /** ISO timestamp of when it happened. */
  at: string;
} & ({ kind: "execution"; execution: ExecutionLog } | { kind: "message"; message: string });

/** One line of the console (glossary: Console). */
export type ConsoleEntry = NewConsoleEntry & { id: string };

export type ConsoleState = {
  /** Entries, oldest first, at most {@link CONSOLE_ENTRY_LIMIT}. */
  entries: ConsoleEntry[];
  /** The least serious level shown; `info` shows everything. */
  minimumLevel: ConsoleLevel;
};

export type ConsoleActions = {
  append: (entry: NewConsoleEntry) => void;
  clear: () => void;
  setMinimumLevel: (level: ConsoleLevel) => void;
};

/** Initial state, exported so tests can reset the store between cases. */
export function getInitialConsoleState(): ConsoleState {
  return { entries: [], minimumLevel: "info" };
}

/**
 * The console's ring buffer (memory only): execution logs and app events. A store of its own,
 * because logs change at a different rate from everything else (state-management.md#stores).
 */
export const useConsoleStore = create<ConsoleState & ConsoleActions>()((set) => ({
  ...getInitialConsoleState(),
  append: (entry) => {
    set((state) => ({
      entries: [...state.entries, { ...entry, id: crypto.randomUUID() }].slice(
        -CONSOLE_ENTRY_LIMIT,
      ),
    }));
  },
  clear: () => {
    set({ entries: [] });
  },
  setMinimumLevel: (minimumLevel) => {
    set({ minimumLevel });
  },
}));
