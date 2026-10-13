import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CollectionsIllustration } from "@/components/illustrations/collections-illustration";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("shows the title as a heading with its description and actions", () => {
    render(
      <EmptyState
        illustration={<CollectionsIllustration />}
        title="No collections yet"
        description="Group related requests."
        actions={<button type="button">New collection</button>}
      />,
    );

    expect(screen.getByRole("heading", { name: "No collections yet" })).toBeInTheDocument();
    expect(screen.getByText("Group related requests.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New collection" })).toBeInTheDocument();
  });

  it("keeps the illustration out of the accessibility tree", () => {
    const { container } = render(
      <EmptyState
        illustration={<CollectionsIllustration />}
        title="Empty"
        description="Nothing."
      />,
    );

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
