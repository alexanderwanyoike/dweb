import { cleanup, render as renderView, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import type { DaemonClient } from "../daemon/client";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
function render(view: ReactNode) {
  return renderView(<MemoryRouter>{view}</MemoryRouter>);
}
afterEach(cleanup);
import { DiagnosticsPage } from "./DiagnosticsPage";
import { snapshot } from "../test/snapshot";
it("shows actual logs and lets the user review exact support details", async () => {
  const lifecycleClient = {
    status: vi.fn(async () => ({
      ownership: "external",
      reachability: "healthy",
      message: "Externally managed",
      log_tail: ["A real test log line"],
    })),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(),
  } as DaemonLifecycleClient;
  render(
    <DiagnosticsPage snapshot={snapshot()} lifecycleClient={lifecycleClient} />,
  );
  expect(await screen.findByText("A real test log line")).toBeVisible();
  expect(screen.getByText("12D3KooPeer")).toBeVisible();
  await userEvent.click(
    screen.getByRole("button", { name: "Prepare support details" }),
  );
  expect(screen.getByRole("dialog")).toHaveTextContent("12D3KooPeer");
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "Nothing is sent automatically",
  );
});
