import { describe, expect, it } from "vitest";

import {
  ancestorsOf,
  authChainOf,
  childrenOf,
  descendantIds,
  sortKeyAfterLast,
  sortKeyAtIndex,
  validateMove,
} from "./collection-tree";
import { duplicateSubtree } from "./duplicate-subtree";
import { asId } from "../ids/ids";
import type { CollectionItem } from "../models/collection.schema";
import {
  createCollection,
  createFolderItem,
  createRequestItem,
  createWorkspace,
} from "../models/model-factories";
import { compareSortKeys, sortKeysBetween } from "../ordering/sort-key";

const NOW = "2026-10-14T09:00:00.000Z";
const [first, second, third] = sortKeysBetween(null, null, 3);
if (!first || !second || !third) throw new Error("expected three sort keys");

const collection = {
  ...createCollection({
    workspaceId: createWorkspace({ name: "Acme" }).id,
    name: "API",
    sortKey: first,
  }),
  auth: { type: "bearer", token: "collection", prefix: "Bearer" } as const,
};
const at = { collectionId: collection.id };

// API
// ├── Auth (folder, basic auth)
// │   ├── Login
// │   └── Tokens (folder, inherits)
// │       └── Refresh
// └── Health
const auth = {
  ...createFolderItem({ ...at, parentId: null, name: "Auth", sortKey: first }),
  auth: { type: "basic", username: "ada", password: "pw" } as const,
};
const login = createRequestItem({ ...at, parentId: auth.id, name: "Login", sortKey: first });
const tokens = createFolderItem({ ...at, parentId: auth.id, name: "Tokens", sortKey: second });
const refresh = createRequestItem({ ...at, parentId: tokens.id, name: "Refresh", sortKey: first });
const health = createRequestItem({ ...at, parentId: null, name: "Health", sortKey: second });
const items: CollectionItem[] = [refresh, health, tokens, login, auth];

describe("collection tree", () => {
  it("lists children in sort order", () => {
    expect(childrenOf(items, collection.id, null).map((item) => item.name)).toEqual([
      "Auth",
      "Health",
    ]);
    expect(childrenOf(items, collection.id, auth.id).map((item) => item.name)).toEqual([
      "Login",
      "Tokens",
    ]);
  });

  it("finds every descendant and every ancestor", () => {
    expect(new Set(descendantIds(items, auth.id))).toEqual(
      new Set([login.id, tokens.id, refresh.id]),
    );
    expect(descendantIds(items, health.id)).toEqual([]);
    expect(ancestorsOf(items, refresh.id).map((item) => item.name)).toEqual(["Tokens", "Auth"]);
    expect(ancestorsOf(items, health.id)).toEqual([]);
  });

  it("stops at cycles in corrupted data", () => {
    const looped = [
      { ...tokens, parentId: refresh.id },
      { ...refresh, parentId: tokens.id },
    ];

    expect(ancestorsOf(looped, refresh.id).map((item) => item.name)).toEqual(["Tokens", "Refresh"]);
    expect(descendantIds(looped, tokens.id)).toEqual([refresh.id, tokens.id]);
  });

  it("builds the auth chain from the item up to the collection", () => {
    expect(authChainOf(items, collection, refresh.id).map((config) => config.type)).toEqual([
      "inherit",
      "inherit",
      "basic",
      "bearer",
    ]);
  });

  it("refuses moves into a request, into itself or below itself", () => {
    expect(validateMove(items, health.id, auth.id)).toBeNull();
    expect(validateMove(items, auth.id, null)).toBeNull();
    expect(validateMove(items, health.id, login.id)).toBe("not_a_folder");
    expect(validateMove(items, auth.id, auth.id)).toBe("into_itself");
    expect(validateMove(items, auth.id, tokens.id)).toBe("into_itself");
    expect(validateMove(items, asId<"CollectionItemId">("missing"), null)).toBe("not_found");
  });

  it("computes keys for placing an item at any position", () => {
    const roots = childrenOf(items, collection.id, null);

    const atStart = sortKeyAtIndex(roots, 0);
    const between = sortKeyAtIndex(roots, 1);
    const atEnd = sortKeyAtIndex(roots, 2);

    expect(compareSortKeys(atStart, auth.sortKey)).toBe(-1);
    expect(compareSortKeys(auth.sortKey, between)).toBe(-1);
    expect(compareSortKeys(between, health.sortKey)).toBe(-1);
    expect(compareSortKeys(health.sortKey, atEnd)).toBe(-1);
    expect(compareSortKeys(health.sortKey, sortKeyAfterLast(roots))).toBe(-1);
  });

  it("ignores the moving item when placing it among its own siblings", () => {
    const roots = childrenOf(items, collection.id, null);

    const key = sortKeyAtIndex(roots, 1, auth.id);

    expect(compareSortKeys(health.sortKey, key)).toBe(-1);
  });
});

describe("duplicateSubtree", () => {
  it("copies a folder and its descendants with fresh, re-linked ids", () => {
    const copy = duplicateSubtree(items, auth.id, { name: "Auth copy", sortKey: third, now: NOW });

    expect(copy.map((item) => item.name)).toEqual(
      expect.arrayContaining(["Auth copy", "Login", "Tokens", "Refresh"]),
    );
    expect(copy).toHaveLength(4);
    const [root] = copy;
    const copiedIds = new Set(copy.map((item) => item.id));
    expect(copiedIds.has(auth.id)).toBe(false);
    expect(root?.parentId).toBeNull();
    for (const item of copy.slice(1)) {
      expect(item.parentId !== null && copiedIds.has(item.parentId)).toBe(true);
    }
    expect(copy.every((item) => item.createdAt === NOW)).toBe(true);
  });

  it("copies deeply, so editing the copy never changes the original", () => {
    const [copy] = duplicateSubtree(items, login.id, {
      name: "Login copy",
      sortKey: third,
      now: NOW,
    });
    if (copy?.type !== "request") throw new Error("expected a request");

    copy.request.headers.push({
      id: asId<"EntryId">("x"),
      key: "X",
      value: "1",
      enabled: true,
      description: "",
    });

    expect(login.request.headers).toEqual([]);
  });

  it("returns nothing for an unknown item", () => {
    expect(
      duplicateSubtree(items, asId<"CollectionItemId">("missing"), {
        name: "x",
        sortKey: third,
        now: NOW,
      }),
    ).toEqual([]);
  });
});
