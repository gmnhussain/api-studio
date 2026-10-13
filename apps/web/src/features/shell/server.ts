/**
 * Server-only entry point of the shell feature, kept apart from `index.ts` so client components
 * can import the feature without pulling in `next/headers`.
 */
export { readUiState } from "./lib/read-ui-state";
