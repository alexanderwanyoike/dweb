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
import { NetworkPage } from "./NetworkPage";
import { snapshot } from "../test/snapshot";
it("keeps inbound reachability unverified despite connected peers", () => {
  render(<NetworkPage snapshot={snapshot()} />);
  expect(screen.getByText("Direct peers")).toBeVisible();
  expect(screen.getByText("Relayed peers")).toBeVisible();
  expect(screen.getByText("Not verified")).toBeVisible();
  expect(screen.getByRole("link", { name: "Manage relays" })).toHaveAttribute("href", "/relays");
});
