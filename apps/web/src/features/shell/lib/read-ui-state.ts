import "server-only";

import { cookies } from "next/headers";

import { readPersistedState } from "@/lib/cookies/read-persisted-state";

import { LAYOUT_COOKIE } from "../shell.constants";
import { parseUiState } from "../shell.schema";
import type { UiState } from "../stores/ui.store";

/**
 * Reads the saved studio layout from the request's cookie, so the server renders panels in their
 * saved sizes and the first frame has no layout shift (ADR-0011). Makes the calling route dynamic.
 */
export async function readUiState(): Promise<UiState> {
  const cookieStore = await cookies();
  return parseUiState(readPersistedState(cookieStore.get(LAYOUT_COOKIE)?.value));
}
