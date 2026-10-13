import { describe, expect, it } from "vitest";

import { createRegistry } from "./registry";

type Generator = { id: "curl" | "fetch" | "axios"; label: string };

describe("createRegistry", () => {
  it("registers, finds and lists contributions in order", () => {
    const registry = createRegistry<Generator>("Code generator");

    registry.register({ id: "curl", label: "cURL" });
    registry.register({ id: "fetch", label: "fetch" });

    expect(registry.get("fetch")?.label).toBe("fetch");
    expect(registry.get("axios")).toBeUndefined();
    expect(registry.list().map((item) => item.id)).toEqual(["curl", "fetch"]);
  });

  it("rejects a duplicate id", () => {
    const registry = createRegistry<Generator>("Code generator");
    registry.register({ id: "curl", label: "cURL" });

    expect(() => registry.register({ id: "curl", label: "Other" })).toThrow(
      'Code generator registry already has a contribution with id "curl"',
    );
  });

  it("removes a contribution when its registration is disposed", () => {
    const registry = createRegistry<Generator>("Code generator");
    const registration = registry.register({ id: "curl", label: "cURL" });

    registration.dispose();
    registration.dispose();

    expect(registry.get("curl")).toBeUndefined();
    expect(registry.list()).toEqual([]);
  });

  it("does not remove a newer contribution with the same id", () => {
    const registry = createRegistry<Generator>("Code generator");
    const first = registry.register({ id: "curl", label: "cURL" });
    first.dispose();
    registry.register({ id: "curl", label: "cURL v2" });

    first.dispose();

    expect(registry.get("curl")?.label).toBe("cURL v2");
  });

  it("returns a stable, frozen list until the registry changes", () => {
    const registry = createRegistry<Generator>("Code generator");
    registry.register({ id: "curl", label: "cURL" });

    const list = registry.list();

    expect(registry.list()).toBe(list);
    expect(Object.isFrozen(list)).toBe(true);
  });
});
