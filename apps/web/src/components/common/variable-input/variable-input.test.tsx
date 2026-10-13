import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { createVariable, mergeVariableScopes } from "@api-studio/core";

import { VariableInput } from "./variable-input";

const variables = mergeVariableScopes({
  global: [
    createVariable({ key: "baseUrl", value: "https://api.dev" }),
    createVariable({ key: "basePath", value: "/v1" }),
  ],
});

function ControlledInput({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <VariableInput
      aria-label="URL"
      value={value}
      onValueChange={setValue}
      variables={variables}
      suggestions={["Accept", "Authorization"]}
    />
  );
}

describe("VariableInput", () => {
  it("highlights defined and unknown variables", () => {
    const { container } = render(<ControlledInput initialValue="{{baseUrl}}/{{missing}}" />);

    expect(container.querySelector("[data-variable=defined]")).toHaveTextContent("{{baseUrl}}");
    expect(container.querySelector("[data-variable=undefined]")).toHaveTextContent("{{missing}}");
  });

  it("offers variables after {{ and inserts the picked one", async () => {
    const user = userEvent.setup();
    render(<ControlledInput />);
    const input = screen.getByRole("combobox", { name: "URL" });

    await user.type(input, "{{{{base");
    expect(await screen.findAllByRole("option")).toHaveLength(2);

    await user.keyboard("{ArrowDown}{Enter}");

    expect(input).toHaveValue("{{baseUrl}}");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("closes on Escape until the value changes again", async () => {
    const user = userEvent.setup();
    render(<ControlledInput />);
    const input = screen.getByRole("combobox", { name: "URL" });

    await user.type(input, "Acc");
    expect(await screen.findByRole("option", { name: "Accept" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await user.type(input, "e");
    expect(await screen.findByRole("option", { name: "Accept" })).toBeInTheDocument();
  });

  it("masks secret values without highlighting them", () => {
    const { container } = render(
      <VariableInput
        aria-label="Password"
        value="{{baseUrl}}"
        onValueChange={() => undefined}
        variables={variables}
        isMasked
      />,
    );

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(container.querySelector("[data-variable]")).toBeNull();
  });
});
