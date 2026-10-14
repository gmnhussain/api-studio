import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@test/render-with-providers";

import { JsonTree } from "./json-tree";
import { createInThreadBodyTaskRunner } from "../../lib/body-task-runner";
import { openJsonDocument, type JsonDocument } from "../../lib/json-document";

/** A viewport tall enough for every row; jsdom lays nothing out, so the size is given. */
const VIEWPORT_HEIGHT_PIXELS = 600;
const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => VIEWPORT_HEIGHT_PIXELS,
  });
});

afterAll(() => {
  if (offsetHeight) Object.defineProperty(HTMLElement.prototype, "offsetHeight", offsetHeight);
});

async function openDocument(value: unknown): Promise<JsonDocument> {
  const document = await openJsonDocument(createInThreadBodyTaskRunner(), JSON.stringify(value));
  if (!document) throw new Error("The test document is not valid JSON");
  return document;
}

const body = { user: { name: "Ada", "first language": "en" }, tags: ["math", "poetry"], id: 7 };

async function renderTree() {
  renderWithProviders(<JsonTree document={await openDocument(body)} />);
  const tree = await screen.findByRole("tree", { name: "JSON tree" });
  return tree;
}

function activeRow(tree: HTMLElement): HTMLElement | null {
  const id = tree.getAttribute("aria-activedescendant");
  return id === null ? null : document.getElementById(id);
}

describe("JsonTree", () => {
  it("shows the top level with sizes and values, the first row active", async () => {
    const tree = await renderTree();
    const rows = await screen.findAllByRole("treeitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      '"user":2 keys',
      '"tags":2 items',
      '"id":7',
    ]);
    expect(rows[0]).toHaveAttribute("aria-expanded", "false");
    expect(rows[2]).not.toHaveAttribute("aria-expanded");
    expect(activeRow(tree)).toBe(rows[0]);
  });

  it("follows the WAI-ARIA tree keyboard model", async () => {
    const user = userEvent.setup();
    const tree = await renderTree();
    tree.focus();

    await user.keyboard("{ArrowRight}");
    await screen.findByText('"Ada"');
    expect(activeRow(tree)).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowRight}");
    expect(activeRow(tree)).toHaveTextContent('"name":"Ada"');
    expect(activeRow(tree)).toHaveAttribute("aria-level", "2");

    await user.keyboard("{ArrowLeft}");
    expect(activeRow(tree)).toHaveTextContent('"user"');
    await user.keyboard("{ArrowLeft}");
    expect(screen.queryByText('"Ada"')).not.toBeInTheDocument();

    // A closed top-level row has no parent to move to.
    await user.keyboard("{ArrowDown}{ArrowLeft}");
    expect(activeRow(tree)).toHaveTextContent('"tags"');

    await user.keyboard("{End}");
    expect(activeRow(tree)).toHaveTextContent('"id":7');
    await user.keyboard("{Home}{ArrowDown}{Enter}");
    await screen.findByText('"poetry"');
  });

  it("toggles a container on click", async () => {
    const user = userEvent.setup();
    await renderTree();
    await user.click(screen.getByText('"tags"'));
    expect(await screen.findByText('"math"')).toBeInTheDocument();
    await user.click(screen.getByText('"tags"'));
    await waitFor(() => {
      expect(screen.queryByText('"math"')).not.toBeInTheDocument();
    });
  });

  it("copies the active value with Mod+C and the path from the context menu", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const tree = await renderTree();
    tree.focus();

    await user.keyboard("{Control>}c{/Control}");
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith(
        '{\n  "name": "Ada",\n  "first language": "en"\n}',
      );
    });

    await user.pointer({ keys: "[MouseRight]", target: screen.getByText('"tags"') });
    await user.click(await screen.findByRole("menuitem", { name: "Copy path" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith("$.tags");
    });
  });

  it("says when the document is empty", async () => {
    renderWithProviders(<JsonTree document={await openDocument({})} />);
    expect(await screen.findByText("The document is empty.")).toBeInTheDocument();
  });
});
