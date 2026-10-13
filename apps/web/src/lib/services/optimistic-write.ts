import { err, ok, type Result } from "@api-studio/core";

/** The three steps of an optimistic change. */
export type OptimisticWrite = {
  /** Updates the store, so the UI changes at once. */
  apply: () => void;
  /** Writes the change to storage. */
  persist: () => Promise<void>;
  /** Undoes `apply` when `persist` fails. */
  rollback: () => void;
};

/**
 * Runs an optimistic change (state-management.md#services-write-through-and-optimistic-updates):
 * apply to the store, persist, and roll back if persisting fails. Storage failures become a
 * `storage` error for the caller to report, never an unhandled rejection.
 */
export async function runOptimisticWrite({
  apply,
  persist,
  rollback,
}: OptimisticWrite): Promise<Result<null, "storage">> {
  apply();
  try {
    await persist();
    return ok(null);
  } catch {
    rollback();
    return err("storage");
  }
}
