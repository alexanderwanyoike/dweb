import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { AppearanceSettings } from "./AppearanceSettings";

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
it("changes and restores appearance through Settings", async () => {
  localStorage.setItem("jolt.console.theme", "light");
  const view = render(<AppearanceSettings />);
  await userEvent.selectOptions(screen.getByLabelText("App theme"), "dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  view.unmount();
  delete document.documentElement.dataset.theme;
  render(<AppearanceSettings />);
  expect(screen.getByLabelText("App theme")).toHaveValue("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  await userEvent.selectOptions(screen.getByLabelText("App theme"), "light");
  expect(document.documentElement.dataset.theme).toBe("light");
});
