import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { ThemeToggle } from "./ThemeToggle";
afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
it("switches appearance and restores the chosen theme", async () => {
  localStorage.setItem("jolt.console.theme", "light");
  const view = render(<ThemeToggle />);
  await userEvent.click(
    screen.getByRole("button", { name: "Use dark appearance" }),
  );
  expect(document.documentElement.dataset.theme).toBe("dark");
  view.unmount();
  render(<ThemeToggle />);
  expect(
    screen.getByRole("button", { name: "Use light appearance" }),
  ).toBeVisible();
});
