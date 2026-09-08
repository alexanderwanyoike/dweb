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
  expect(screen.getByText("Your node is running.")).toBeVisible();
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
  expect(screen.queryByText("Your node is running.")).not.toBeInTheDocument();
});
