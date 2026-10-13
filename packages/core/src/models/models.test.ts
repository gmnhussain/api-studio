import { describe, expect, it } from "vitest";

import { authConfigSchema } from "./auth.schema";
import { collectionItemSchema, collectionSchema } from "./collection.schema";
import { editorTabSchema, tabLayoutSchema } from "./editor-tab.schema";
import { environmentSchema } from "./environment.schema";
import { variableSchema } from "./key-value-entry.schema";
import {
  createCollection,
  createEditorTab,
  createEnvironment,
  createFolderItem,
  createHttpRequestDefinition,
  createKeyValueEntry,
  createRequestItem,
  createTabLayout,
  createVariable,
  createWorkspace,
} from "./model-factories";
import { NAME_MAX_LENGTH, RECENTLY_CLOSED_TABS_LIMIT } from "./models.constants";
import { requestBodySchema } from "./request-body.schema";
import { requestDraftSchema } from "./request-draft.schema";
import { requestDefinitionSchema } from "./request.schema";
import { workspaceSchema } from "./workspace.schema";
import { sortKeyBetween } from "../ordering/sort-key";

const NOW = "2026-10-14T09:30:00.000Z";
const sortKey = sortKeyBetween(null, null);

describe("model factories", () => {
  const workspace = createWorkspace({ name: "Acme", now: NOW });
  const collection = createCollection({ workspaceId: workspace.id, name: "Users API", sortKey });
  const folder = createFolderItem({
    collectionId: collection.id,
    parentId: null,
    name: "Auth",
    sortKey,
  });

  it("build records that their schemas accept", () => {
    expect(workspaceSchema.parse(workspace)).toEqual(workspace);
    expect(collectionSchema.parse(collection)).toEqual(collection);
    expect(collectionItemSchema.parse(folder)).toEqual(folder);

    const request = createRequestItem({
      collectionId: collection.id,
      parentId: folder.id,
      name: "Login",
      sortKey,
    });
    expect(collectionItemSchema.parse(request)).toEqual(request);

    const environment = createEnvironment({ workspaceId: workspace.id, name: "Local", sortKey });
    expect(environmentSchema.parse(environment)).toEqual(environment);
  });

  it("use the injected time for both timestamps", () => {
    expect(workspace.createdAt).toBe(NOW);
    expect(workspace.updatedAt).toBe(NOW);
  });

  it("start requests as an empty GET that inherits auth", () => {
    const request = createHttpRequestDefinition();

    expect(request).toMatchObject({
      method: "GET",
      url: "",
      auth: { type: "inherit" },
      body: { type: "none" },
    });
    expect(requestDefinitionSchema.parse(request)).toEqual(request);
  });

  it("give every entry and variable its own id", () => {
    const entries = [createKeyValueEntry(), createKeyValueEntry({ key: "Accept" })];

    expect(entries[0]?.id).not.toBe(entries[1]?.id);
    expect(entries[1]?.key).toBe("Accept");
    expect(variableSchema.parse(createVariable({ isSecret: true })).isSecret).toBe(true);
  });
});

describe("model schemas", () => {
  it("reject ids that are not UUIDs", () => {
    const workspace = createWorkspace({ name: "Acme" });

    expect(workspaceSchema.safeParse({ ...workspace, id: "workspace-1" }).success).toBe(false);
  });

  it("trim names and reject empty or overlong ones", () => {
    const workspace = createWorkspace({ name: "Acme" });

    expect(workspaceSchema.parse({ ...workspace, name: "  Acme  " }).name).toBe("Acme");
    expect(workspaceSchema.safeParse({ ...workspace, name: "   " }).success).toBe(false);
    expect(
      workspaceSchema.safeParse({ ...workspace, name: "x".repeat(NAME_MAX_LENGTH + 1) }).success,
    ).toBe(false);
  });

  it("reject timestamps that are not ISO 8601", () => {
    const workspace = createWorkspace({ name: "Acme" });

    expect(workspaceSchema.safeParse({ ...workspace, createdAt: "yesterday" }).success).toBe(false);
  });

  it("reject request settings outside their limits", () => {
    const request = createHttpRequestDefinition();

    for (const settings of [
      { ...request.settings, timeoutMilliseconds: 0 },
      { ...request.settings, timeoutMilliseconds: 1.5 },
      { ...request.settings, maxRedirects: -1 },
      { ...request.settings, maxRedirects: 51 },
    ]) {
      expect(requestDefinitionSchema.safeParse({ ...request, settings }).success).toBe(false);
    }
  });

  it("accept every auth scheme and reject unknown ones", () => {
    for (const auth of [
      { type: "none" },
      { type: "inherit" },
      { type: "basic", username: "ada", password: "secret" },
      { type: "bearer", token: "abc", prefix: "Bearer" },
      { type: "api_key", key: "X-Api-Key", value: "abc", placement: "header" },
      {
        type: "oauth2",
        grantType: "client_credentials",
        accessTokenUrl: "https://auth.example.com/token",
        clientId: "id",
        clientSecret: "secret",
        scope: "read",
        accessToken: "",
      },
    ]) {
      expect(authConfigSchema.safeParse(auth).success).toBe(true);
    }
    expect(authConfigSchema.safeParse({ type: "digest" }).success).toBe(false);
    expect(
      authConfigSchema.safeParse({ type: "api_key", key: "k", value: "v", placement: "body" })
        .success,
    ).toBe(false);
  });

  it("accept every body type and reject unknown ones", () => {
    const entry = createKeyValueEntry({ key: "name", value: "Ada" });

    for (const body of [
      { type: "none" },
      { type: "json", text: "{}" },
      { type: "text", text: "hello" },
      { type: "xml", text: "<a/>" },
      { type: "form_data", entries: [{ ...entry, kind: "text" }] },
      { type: "url_encoded", entries: [entry] },
      { type: "binary", fileName: null },
    ]) {
      expect(requestBodySchema.safeParse(body).success).toBe(true);
    }
    expect(requestBodySchema.safeParse({ type: "graphql", query: "{}" }).success).toBe(false);
  });

  it("tell folders and requests apart by type", () => {
    const placement = {
      collectionId: createCollection({
        workspaceId: createWorkspace({ name: "Acme" }).id,
        name: "API",
        sortKey,
      }).id,
      parentId: null,
      sortKey,
    };
    const folder = createFolderItem({ ...placement, name: "Auth" });

    expect(collectionItemSchema.safeParse({ ...folder, type: "request" }).success).toBe(false);
  });
});

describe("editor tabs and drafts", () => {
  const workspace = createWorkspace({ name: "Acme" });

  it("build tabs, layouts and drafts that their schemas accept", () => {
    const tab = createEditorTab({ workspaceId: workspace.id, now: NOW });
    const layout = {
      ...createTabLayout({ workspaceId: workspace.id, now: NOW }),
      tabs: [tab],
      activeTabId: tab.id,
    };
    const draft = {
      tabId: tab.id,
      workspaceId: workspace.id,
      baseUpdatedAt: null,
      name: "Untitled request",
      request: createHttpRequestDefinition(),
    };

    expect(tab).toMatchObject({ kind: "request", entityId: null, isPinned: false, openedAt: NOW });
    expect(tabLayoutSchema.parse(layout)).toEqual(layout);
    expect(requestDraftSchema.parse(draft)).toEqual(draft);
  });

  it("reject tabs of unknown kinds, empty entity ids and too many closed tabs", () => {
    const tab = createEditorTab({ workspaceId: workspace.id });
    const layout = createTabLayout({ workspaceId: workspace.id });

    expect(editorTabSchema.safeParse({ ...tab, kind: "terminal" }).success).toBe(false);
    expect(editorTabSchema.safeParse({ ...tab, entityId: "" }).success).toBe(false);
    expect(
      tabLayoutSchema.safeParse({
        ...layout,
        recentlyClosed: Array.from({ length: RECENTLY_CLOSED_TABS_LIMIT + 1 }, () => tab),
      }).success,
    ).toBe(false);
  });
});
