import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { ConsoleShell } from "./ConsoleShell";
import { AppsPage, createAppAccessGateway } from "../apps";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import type { DaemonClient } from "../daemon/client";

afterEach(cleanup);
it("offers one Apps refresh that reloads access, not the unrelated daemon summary", async () => {
  const client = {
    daemonUrl: "",
    get: vi.fn(async (path: string) => {
      if (path.endsWith("identities"))
        return { identities: [], active_identity: null };
      return [];
    }),
    post: vi.fn(),
  } as unknown as DaemonClient;
  const refreshDaemon = vi.fn();
  const snapshot = {
    status: null,
    connected: true,
    daemonUrl: "",
    refresh: refreshDaemon,
  } as unknown as DaemonSnapshot;
  render(
    <MemoryRouter initialEntries={["/apps"]}>
      <ConsoleShell snapshot={snapshot} consoleVersion="0.5.3">
        <AppsPage
          gateway={createAppAccessGateway(client)}
          refreshIntervalMs={0}
        />
      </ConsoleShell>
    </MemoryRouter>,
  );
  await screen.findByText("A place for your apps.");
  const refresh = screen.getAllByRole("button", { name: /refresh/i });
  expect(refresh).toHaveLength(1);
  vi.mocked(client.get).mockClear();
  await userEvent.click(refresh[0]);
  expect(client.get).toHaveBeenCalledWith("/admin/v1/app-access/requests");
  expect(client.get).toHaveBeenCalledWith("/admin/v1/app-access/sessions");
  expect(refreshDaemon).not.toHaveBeenCalled();
});

it("restores the saved appearance without putting an appearance control in the toolbar", () => {
  localStorage.setItem("jolt.console.theme", "dark");
  delete document.documentElement.dataset.theme;
  render(
    <MemoryRouter>
      <ConsoleShell
        snapshot={{ connected: true, status: null } as DaemonSnapshot}
        consoleVersion="0.5.3"
      >
        <div>Screen content</div>
      </ConsoleShell>
    </MemoryRouter>,
  );
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(
    screen.queryByRole("button", { name: /appearance/i }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Refresh" })).toHaveAttribute(
    "title",
    "Refresh",
  );
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
