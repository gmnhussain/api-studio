// @vitest-environment node
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createVariable,
  createWorkspace,
  type EnvironmentId,
  type WorkspaceId,
} from "@api-studio/core";

import { createDatabase, type ApiStudioDatabase } from "@/lib/db/database";

import { createEnvironmentService } from "./environment.service";
import { createEnvironmentRepository } from "../repositories/environment.repository";
import { getInitialEnvironmentState, useEnvironmentStore } from "../stores/environment.store";

let database: ApiStudioDatabase;
const workspace = createWorkspace({ name: "Acme" });

function setUp(activeEnvironmentId: EnvironmentId | null = null) {
  let active = activeEnvironmentId;
  const setActiveEnvironment = vi.fn((_: WorkspaceId, environmentId: EnvironmentId | null) => {
    active = environmentId;
    return Promise.resolve();
  });
  const repository = createEnvironmentRepository(database);
  const service = createEnvironmentService({
    repository,
    store: useEnvironmentStore,
    setActiveEnvironment,
    getActiveEnvironmentId: () => active,
  });
  return { repository, service, setActiveEnvironment };
}

beforeEach(() => {
  database = createDatabase(`test-${crypto.randomUUID()}`);
  useEnvironmentStore.setState(getInitialEnvironmentState());
});

afterEach(async () => {
  await database.delete();
});

describe("environment service", () => {
  it("creates environments in order and keeps them after a reload", async () => {
    const { service } = setUp();
    await service.loadEnvironments(workspace.id);

    await service.createEnvironment("Local", "green");
    await service.createEnvironment("Production", "red");
    useEnvironmentStore.setState(getInitialEnvironmentState());
    await setUp().service.loadEnvironments(workspace.id);

    expect(
      useEnvironmentStore.getState().environments.map(({ name, color }) => ({ name, color })),
    ).toEqual([
      { name: "Local", color: "green" },
      { name: "Production", color: "red" },
    ]);
  });

  it("renames and saves variables, refusing bad names and unknown environments", async () => {
    const { service, repository } = setUp();
    await service.loadEnvironments(workspace.id);
    const created = await service.createEnvironment("Local");
    if (!created.ok) throw new Error("expected an environment");
    const token = createVariable({ key: "token", value: "abc", isSecret: true });

    await service.renameEnvironment(created.value.id, "Staging");
    await service.setVariables(created.value.id, [token]);

    expect(await repository.get(created.value.id)).toMatchObject({
      name: "Staging",
      variables: [token],
    });
    expect(await service.renameEnvironment(created.value.id, " ")).toEqual({
      ok: false,
      error: "invalid_name",
    });
    expect(await service.createEnvironment("")).toEqual({ ok: false, error: "invalid_name" });
  });

  it("clears the active environment when it is deleted", async () => {
    const first = setUp();
    await first.service.loadEnvironments(workspace.id);
    const created = await first.service.createEnvironment("Local");
    if (!created.ok) throw new Error("expected an environment");
    const { service, setActiveEnvironment, repository } = setUp(created.value.id);

    expect(await service.deleteEnvironment(created.value.id)).toEqual({ ok: true, value: null });
    expect(setActiveEnvironment).toHaveBeenCalledWith(workspace.id, null);
    expect(await repository.getAll()).toEqual([]);
  });

  it("refuses to create without a loaded workspace", async () => {
    expect(await setUp().service.createEnvironment("Local")).toEqual({
      ok: false,
      error: "no_workspace",
    });
  });
});
