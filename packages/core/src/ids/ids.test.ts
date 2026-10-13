import { describe, expect, it } from "vitest";

import { asId, createId, type CollectionId, type WorkspaceId } from "./ids";

describe("ids", () => {
  // Ordering across milliseconds is covered in uuid-v7.test.ts; within one millisecond the random
  // bits are unordered (RFC 9562 makes a monotonic counter optional), so it is not asserted here.
  it("creates distinct UUID v7 ids", () => {
    const first = createId<"WorkspaceId">();
    const second = createId<"WorkspaceId">();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
  });

  it("keeps id kinds apart at the type level", () => {
    const workspaceId: WorkspaceId = asId<"WorkspaceId">("0190a1b2-0000-7000-8000-000000000000");
    // @ts-expect-error a workspace id is not a collection id
    const collectionId: CollectionId = workspaceId;

    expect(collectionId).toBe(workspaceId);
  });
});
