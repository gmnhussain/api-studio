import { afterEach, describe, expect, it } from "vitest";

import type { Disposable, ResponseSnapshot } from "@api-studio/core";

import { pickViewer, responseViewers, viewersFor, type ResponseViewer } from "./response-viewers";

function viewer(id: string, priority: number, formats: readonly string[]): ResponseViewer {
  return {
    id,
    label: "pretty",
    priority,
    canView: (format) => formats.includes(format),
    View: () => null,
  };
}

const response = {} as ResponseSnapshot;
const registrations: Disposable[] = [];

afterEach(() => {
  for (const registration of registrations.splice(0)) registration.dispose();
});

describe("viewersFor", () => {
  it("lists the viewers that can show a body, in registration order", () => {
    registrations.push(
      responseViewers.register(viewer("pretty", 30, ["json"])),
      responseViewers.register(viewer("image", 40, ["image"])),
      responseViewers.register(viewer("raw", 10, ["json", "text"])),
    );
    expect(viewersFor("json", response).map((item) => item.id)).toEqual(["pretty", "raw"]);
    expect(viewersFor("binary", response)).toEqual([]);
  });
});

describe("pickViewer", () => {
  const viewers = [viewer("raw", 10, []), viewer("pretty", 30, []), viewer("tree", 20, [])];

  it("keeps the viewer picked for the tab when it can show the body", () => {
    expect(pickViewer(viewers, "tree")?.id).toBe("tree");
  });

  it("falls back to the highest priority", () => {
    expect(pickViewer(viewers, null)?.id).toBe("pretty");
    expect(pickViewer(viewers, "image-preview")?.id).toBe("pretty");
  });

  it("is undefined when no viewer can show the body", () => {
    expect(pickViewer([], "raw")).toBeUndefined();
  });
});
