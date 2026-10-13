import {
  createHttpRequestDefinition,
  isDeepEqual,
  type CollectionItem,
  type RequestDraft,
  type RequestItem,
} from "@api-studio/core";

/** A collection item if it is a saved request. */
export function asRequestItem(item: CollectionItem | undefined): RequestItem | undefined {
  return item?.type === "request" ? item : undefined;
}

/** Whether a draft holds exactly what its saved request holds. */
export function matchesSavedRequest(draft: RequestDraft, saved: RequestItem): boolean {
  return draft.name === saved.name && isDeepEqual(draft.request, saved.request);
}

/**
 * Whether a draft has changes that closing its tab would lose: for a saved request, anything that
 * differs from the saved version; for a new request, anything typed into it at all.
 */
export function isDraftDirty(draft: RequestDraft, saved: RequestItem | undefined): boolean {
  if (saved) return !matchesSavedRequest(draft, saved);
  return !isDeepEqual(draft.request, createHttpRequestDefinition());
}

/**
 * Whether the saved request changed elsewhere (another browser tab, an import) after this draft
 * started from it, while the draft has changes of its own. Clean drafts simply follow the saved
 * version, so they never conflict.
 */
export function hasSavedConflict(draft: RequestDraft, saved: RequestItem | undefined): boolean {
  return (
    saved !== undefined &&
    draft.baseUpdatedAt !== saved.updatedAt &&
    !matchesSavedRequest(draft, saved)
  );
}

/** A draft that starts from (or is reset to) a saved request. */
export function draftFromSaved(draft: RequestDraft, saved: RequestItem): RequestDraft {
  return { ...draft, name: saved.name, request: saved.request, baseUpdatedAt: saved.updatedAt };
}
