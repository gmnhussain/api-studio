import { describe, expect, it } from "vitest";

import { asId, createId, type CollectionId, type WorkspaceId } from "./ids";

describe("ids", () => {
  it("creates distinct, time-sortable ids", () => {
    const first = createId<"WorkspaceId">();
    const second = createId<"WorkspaceId">();

    expect(first).not.toBe(second);
    expect(first <= second).toBe(true);
  });

  it("keeps id kinds apart at the type level", () => {
    const workspaceId: WorkspaceId = asId<"WorkspaceId">("0190a1b2-0000-7000-8000-000000000000");
    // @ts-expect-error a workspace id is not a collection id
    const collectionId: CollectionId = workspaceId;

    expect(collectionId).toBe(workspaceId);
  });
});
