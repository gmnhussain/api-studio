import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { OpenLastWorkspace } from "@/features/workspace";
import { readLastWorkspaceId } from "@/features/workspace/server";

/**
 * `/` opens the workspace used last in this browser. Returning visits redirect on the server
 * from the last-workspace cookie; the first visit, or one whose cookie was cleared, picks a
 * workspace in the browser, creating the first one on first run.
 */
export default async function HomePage() {
  const lastWorkspaceId = await readLastWorkspaceId();
  if (lastWorkspaceId) redirect(routes.workspace(lastWorkspaceId));
  return <OpenLastWorkspace />;
}
