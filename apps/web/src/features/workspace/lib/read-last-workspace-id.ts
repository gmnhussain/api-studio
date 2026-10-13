import "server-only";

import { cookies } from "next/headers";

import { idSchema, type WorkspaceId } from "@api-studio/core";

import { LAST_WORKSPACE_COOKIE } from "../workspace.constants";

const workspaceIdSchema = idSchema<"WorkspaceId">();

/**
 * The workspace last opened in this browser, read from its cookie so `/` can redirect on the
 * server. `null` on first run or when the cookie holds anything but a workspace id.
 */
export async function readLastWorkspaceId(): Promise<WorkspaceId | null> {
  const cookieStore = await cookies();
  const result = workspaceIdSchema.safeParse(cookieStore.get(LAST_WORKSPACE_COOKIE)?.value);
  return result.success ? result.data : null;
}
