import { describe, expect, it } from "vitest";

import {
  createCollection,
  createFolderItem,
  createRequestItem,
  createWorkspace,
  sortKeysBetween,
} from "@api-studio/core";

import { listSaveLocations } from "./save-locations";

describe("listSaveLocations", () => {
  it("lists each collection root and its folders depth first, but not requests", () => {
    const workspace = createWorkspace({ name: "Acme" });
    const [first, second, third] = sortKeysBetween(null, null, 3);
    if (!first || !second || !third) throw new Error("expected three sort keys");
    const users = createCollection({ workspaceId: workspace.id, name: "Users", sortKey: second });
    const admin = createCollection({ workspaceId: workspace.id, name: "Admin", sortKey: first });
    const auth = createFolderItem({
      collectionId: users.id,
      parentId: null,
      name: "Auth",
      sortKey: first,
    });
    const tokens = createFolderItem({
      collectionId: users.id,
      parentId: auth.id,
      name: "Tokens",
      sortKey: first,
    });
    const login = createRequestItem({
      collectionId: users.id,
      parentId: auth.id,
      name: "Login",
      sortKey: third,
    });

    const options = listSaveLocations([users, admin], [login, tokens, auth]);

    expect(options.map((option) => [option.collectionName, ...option.folderPath])).toEqual([
      ["Admin"],
      ["Users"],
      ["Users", "Auth"],
      ["Users", "Auth", "Tokens"],
    ]);
    expect(options[3]).toMatchObject({ collectionId: users.id, parentId: tokens.id });
    expect(new Set(options.map((option) => option.id)).size).toBe(options.length);
  });
});
