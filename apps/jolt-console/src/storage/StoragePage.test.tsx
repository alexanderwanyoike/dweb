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
import { StoragePage } from "./StoragePage";
import { snapshot } from "../test/snapshot";
it("renders cache storage metrics", () => {
  render(<StoragePage snapshot={snapshot()} />);

  expect(screen.getByText("Cached bytes")).toBeInTheDocument();
  expect(screen.getByText("4.00 KB")).toBeInTheDocument();
  expect(screen.getByText("Available")).toBeInTheDocument();
});
