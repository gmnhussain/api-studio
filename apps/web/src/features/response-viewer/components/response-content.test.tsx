import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { asId, type Disposable, type ResponseSnapshot } from "@api-studio/core";

import { renderWithProviders } from "@test/render-with-providers";

import { ResponseContent } from "./response-content";
import { responseViewers, type ResponseViewerProps } from "../lib/response-viewers";
import {
  getInitialResponseViewerState,
  useResponseViewerStore,
} from "../stores/response-viewer.store";

const firstTab = asId<"TabId">("tab-1");
const secondTab = asId<"TabId">("tab-2");

const response: ResponseSnapshot = {
  status: 200,
  statusText: "OK",
  url: "https://api.example/users",
  headers: [
    { name: "Content-Type", value: "application/json" },
    { name: "X-Request-Id", value: "req-42" },
  ],
  cookies: [
    {
      name: "session",
      value: "s1",
      domain: "api.example",
      hostOnly: true,
      path: "/",
      expiresAt: null,
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    },
  ],
  body: { encoding: "text", data: '{"a":1}', contentType: "application/json", truncated: false },
  sizes: { requestBytes: 120, responseHeadersBytes: 80, responseBodyBytes: 7, decodedBodyBytes: 7 },
  timings: {
    startedAt: "2026-10-14T10:00:00.000Z",
    timeToFirstByteMilliseconds: 90,
    downloadMilliseconds: 10,
    totalMilliseconds: 100,
  },
  redirects: [{ status: 302, url: "https://api.example/old-users", location: "/users" }],
  httpVersion: "1.1",
};

function FakeView({ format }: ResponseViewerProps) {
  return <p>{`fake view of ${format}`}</p>;
}

const registrations: Disposable[] = [];

beforeEach(() => {
  useResponseViewerStore.setState(getInitialResponseViewerState());
  registrations.push(
    responseViewers.register({
      id: "pretty",
      label: "pretty",
      priority: 30,
      canView: (format) => format === "json",
      View: FakeView,
    }),
    responseViewers.register({
      id: "raw",
      label: "raw",
      priority: 10,
      canView: (_format, current) => current.body.encoding === "text",
      View: () => <p>raw text</p>,
    }),
  );
});

afterEach(() => {
  for (const registration of registrations.splice(0)) registration.dispose();
});

function renderContent(tabId = firstTab, shown: ResponseSnapshot = response) {
  return renderWithProviders(<ResponseContent tabId={tabId} response={shown} method="GET" />);
}

describe("ResponseContent", () => {
  it("shows the best body view, and keeps the one picked for each tab", async () => {
    const user = userEvent.setup();
    const { rerender } = renderContent();
    expect(screen.getByText("fake view of json")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Raw" }));
    expect(screen.getByRole("button", { name: "Raw" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("raw text")).toBeInTheDocument();

    rerender(<ResponseContent tabId={secondTab} response={response} method="GET" />);
    expect(screen.getByText("fake view of json")).toBeInTheDocument();
    rerender(<ResponseContent tabId={firstTab} response={response} method="GET" />);
    expect(screen.getByText("raw text")).toBeInTheDocument();
  });

  it("filters headers by name or value, and Escape clears the filter", async () => {
    const user = userEvent.setup();
    renderContent();
    await user.click(screen.getByRole("tab", { name: /Headers/ }));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();

    const filter = screen.getByRole("searchbox", { name: "Filter headers" });
    await user.type(filter, "REQ-4");
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "X-Request-Id" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Content-Type" })).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(filter).toHaveValue("");
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
  });

  it("lists the cookies the response set with their attributes", async () => {
    const user = userEvent.setup();
    renderContent();
    await user.click(screen.getByRole("tab", { name: /Cookies/ }));
    const row = screen.getByRole("row", { name: /session/ });
    expect(within(row).getByText("Session")).toBeInTheDocument();
    expect(within(row).getByText("HttpOnly")).toBeInTheDocument();
    expect(within(row).getByText("SameSite=Lax")).toBeInTheDocument();
  });

  it("shows the phases and the redirect chain on the timeline", async () => {
    const user = userEvent.setup();
    renderContent();
    await user.click(screen.getByRole("tab", { name: "Timeline" }));
    expect(screen.getByText("Waiting (TTFB)")).toBeInTheDocument();
    expect(screen.getByText("90 ms")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1 redirect" })).toBeInTheDocument();
    expect(screen.getByText("GET https://api.example/old-users")).toBeInTheDocument();
    expect(screen.getByText("https://api.example/users")).toBeInTheDocument();
  });

  it("explains bodies that no view can show, and empty bodies", () => {
    const { unmount } = renderContent(firstTab, {
      ...response,
      body: { encoding: "base64", data: "AAEC", contentType: "application/pdf", truncated: false },
    });
    expect(screen.getByText(/A application\/pdf body of 7 B/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Download" })).not.toHaveLength(0);
    unmount();

    renderContent(firstTab, { ...response, body: { ...response.body, data: "" } });
    expect(screen.getByText("The response has no body.")).toBeInTheDocument();
  });
});
