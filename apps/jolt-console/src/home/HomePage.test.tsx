import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, it, expect } from "vitest";
import { HomePage } from "./HomePage";
import { snapshot } from "../test/snapshot";
afterEach(cleanup);
it("separates local health from unverified incoming connectivity", () => {
  render(
    <MemoryRouter>
      <HomePage snapshot={snapshot()} />
    </MemoryRouter>,
  );
  expect(screen.getByRole("status", { name: "Local node" })).toHaveTextContent(
    "Running",
  );
  expect(screen.getByText("Not verified")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Manage app access" }),
  ).toHaveAttribute("href", "/apps");
});
it("marks retained information as stale when refresh fails", () => {
  render(
    <MemoryRouter>
      <HomePage
        snapshot={snapshot({ connected: false, lastError: "Offline" })}
      />
    </MemoryRouter>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Last known information");
  expect(screen.getByRole("status", { name: "Local node" })).toHaveTextContent(
    "Unavailable",
  );
});

it("does not show a healthy node while the first connection is pending", () => {
  render(
    <MemoryRouter>
      <HomePage
        snapshot={snapshot({
          connected: false,
          status: null,
          lastError: null,
          lastRefresh: null,
        })}
      />
    </MemoryRouter>,
  );
  expect(screen.getByRole("status", { name: "Local node" })).toHaveTextContent(
    "Checking",
  );
});
