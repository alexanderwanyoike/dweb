import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { it, expect, afterEach } from "vitest";
import { PublishedPage } from "./PublishedPage";
import { snapshot } from "../test/snapshot";
afterEach(cleanup);
it("lists the full inventory and inspects the exact selected object", async () => {
  const published = Array.from({ length: 12 }, (_, i) => ({
    content_id: `cid-${i}`,
    path: `/test/${i}`,
    size: i + 1,
    address: `alice.jolt/test/${i}`
  }));
  render(
    <MemoryRouter>
      <PublishedPage snapshot={snapshot({ published })} />
    </MemoryRouter>
  );
  expect(screen.getByText("/test/11")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Inspect /test/11" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("cid-11");
  expect(screen.getByRole("dialog")).toHaveTextContent("alice.jolt/test/11");
});
