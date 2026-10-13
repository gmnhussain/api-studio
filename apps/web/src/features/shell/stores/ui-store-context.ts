import { createContext } from "react";

import type { UiStore } from "./ui.store";

/** Holds the page's UI store; provided by `UiStoreProvider`. */
export const UiStoreContext = createContext<UiStore | null>(null);
