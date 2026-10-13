/**
 * Server-only entry point of the workspace feature, kept apart from `index.ts` so client
 * components can import the feature without pulling in `next/headers`.
 */
export { readLastWorkspaceId } from "./lib/read-last-workspace-id";
