import { beforeEach, describe, expect, it } from "vitest";

import { asId } from "@api-studio/core";

import { getInitialResponseViewerState, useResponseViewerStore } from "./response-viewer.store";

const first = asId<"TabId">("tab-1");
const second = asId<"TabId">("tab-2");

beforeEach(() => {
  useResponseViewerStore.setState(getInitialResponseViewerState());
});

describe("useResponseViewerStore", () => {
  it("keeps the section and body view of each tab apart", () => {
    const { setSection, setViewer } = useResponseViewerStore.getState();
    setSection(first, "headers");
    setViewer(first, "tree");
    setViewer(second, "raw");

    expect(useResponseViewerStore.getState().views).toEqual({
      [first]: { section: "headers", viewerId: "tree" },
      [second]: { section: "body", viewerId: "raw" },
    });
  });

  it("forgets closed tabs, and changes nothing when none of them had a view", () => {
    const { setSection, forgetTabs } = useResponseViewerStore.getState();
    setSection(first, "cookies");
    setSection(second, "timeline");
    forgetTabs([first]);
    expect(Object.keys(useResponseViewerStore.getState().views)).toEqual([second]);

    const before = useResponseViewerStore.getState();
    forgetTabs([first]);
    expect(useResponseViewerStore.getState()).toBe(before);
  });
});
