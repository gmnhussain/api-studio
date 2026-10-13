import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createKeyValueEntry, type KeyValueEntry } from "@api-studio/core";

import { KeyValueTable } from "./key-value-table";
import type { KeyValueTableLabels } from "./key-value-table-labels";

const labels: KeyValueTableLabels = {
  key: "Key",
  value: "Value",
  description: "Description",
  enabled: "Enabled",
  actions: "Actions",
  keyPlaceholder: "Add a key",
  valuePlaceholder: "Value",
  descriptionPlaceholder: "Description",
  newKey: "New key",
  newValue: "New value",
  newDescription: "New description",
  untitledRow: "untitled row",
  enableRow: (row) => `Send ${row}`,
  keyOf: (row) => `Key of ${row}`,
  valueOf: (row) => `Value of ${row}`,
  descriptionOf: (row) => `Description of ${row}`,
  removeRow: (row) => `Remove ${row}`,
};

const onChange = vi.fn<(entries: KeyValueEntry[]) => void>();
const latest = () => onChange.mock.lastCall?.[0] ?? [];

function Table({ initial = [], fixed = false }: { initial?: KeyValueEntry[]; fixed?: boolean }) {
  const [entries, setEntries] = useState(initial);
  return (
    <KeyValueTable
      aria-label="Headers"
      entries={entries}
      onEntriesChange={(next) => {
        onChange(next);
        setEntries(next);
      }}
      createEntry={() => createKeyValueEntry()}
      variables={new Map()}
      hasFixedKeys={fixed}
      labels={labels}
    />
  );
}

beforeEach(() => {
  onChange.mockReset();
});

describe("KeyValueTable", () => {
  it("adds a row from the placeholder and keeps typing in it", async () => {
    const user = userEvent.setup();
    render(<Table />);

    await user.type(screen.getByRole("combobox", { name: "New key" }), "Accept");

    expect(latest().map((entry) => entry.key)).toEqual(["Accept"]);
    expect(screen.getByRole("combobox", { name: "Key of Accept" })).toHaveFocus();
    expect(screen.getByRole("combobox", { name: "New key" })).toHaveValue("");
  });

  it("edits, disables and removes rows", async () => {
    const user = userEvent.setup();
    render(<Table initial={[createKeyValueEntry({ key: "Accept", value: "text/html" })]} />);

    await user.clear(screen.getByRole("combobox", { name: "Value of Accept" }));
    await user.type(screen.getByRole("combobox", { name: "Value of Accept" }), "*/*");
    await user.click(screen.getByRole("checkbox", { name: "Send Accept" }));
    expect(latest()[0]).toMatchObject({ value: "*/*", enabled: false });

    await user.click(screen.getByRole("button", { name: "Remove Accept" }));
    expect(latest()).toEqual([]);
  });

  it("shows fixed keys as text, without a placeholder or remove buttons", () => {
    render(<Table fixed initial={[createKeyValueEntry({ key: "id" })]} />);

    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "New key" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove id" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Value of id" })).toBeInTheDocument();
  });
});
