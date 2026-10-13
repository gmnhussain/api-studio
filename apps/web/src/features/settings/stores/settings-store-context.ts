import { createContext } from "react";

import type { SettingsStore } from "./settings.store";

/** Holds the page's settings store; provided by `SettingsProvider`. */
export const SettingsStoreContext = createContext<SettingsStore | null>(null);
