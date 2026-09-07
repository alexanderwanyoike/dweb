import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppsPage } from "../sections/AppsPage";
import { grant } from "./fixtures.test-support";
import type { DaemonClient } from "../daemon/client";
afterEach(cleanup);
it("shows one app for multiple identities and reviews exact sessions before revoking", async () => {
  const sessions = [
    grant("one"),
    grant("two", { identity: "bob.jolt", app_origin: "http://localhost:5179" }),
  ];
  const client = {
    daemonUrl: "",
    get: vi.fn(async (path: string) => {
      if (path.endsWith("/sessions")) return sessions;
      if (path.endsWith("identities"))
        return { identities: [], active_identity: "alice.jolt" };
      return [];
    }),
    post: vi.fn(async () => ({})),
  } as unknown as DaemonClient;
  render(<AppsPage client={client} refreshIntervalMs={0} />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Manage Spoke access" }),
  );
  expect(
    screen.getAllByRole("button", { name: "Manage Spoke access" }),
  ).toHaveLength(1);
  await userEvent.click(
    screen.getByRole("button", { name: "Revoke Spoke access" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Revoke Spoke access?" });
  expect(within(dialog).getByText("alice.jolt")).toBeVisible();
  expect(within(dialog).getByText("bob.jolt")).toBeVisible();
  expect(client.post).not.toHaveBeenCalled();
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Revoke access" }),
  );
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-access/sessions/one/revoke",
  );
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-access/sessions/two/revoke",
  );
});
it("keeps partial failures visible and retries only the failed sessions", async () => {
  let sessions = [grant("one"), grant("two")];
  let failSecond = true;
  const client = {
    daemonUrl: "",
    get: vi.fn(async (path: string) => {
      if (path.endsWith("/sessions")) return sessions;
      if (path.endsWith("identities"))
        return { identities: [], active_identity: null };
      return [];
    }),
    post: vi.fn(async (path: string) => {
      if (path.includes("/two/") && failSecond)
        throw new Error("Connection lost");
      sessions = sessions.map((session) =>
        path.includes(`/${session.session_id}/`)
          ? { ...session, status: "revoked" }
          : session,
      );
      return {};
    }),
  } as unknown as DaemonClient;
  render(<AppsPage client={client} refreshIntervalMs={0} />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Manage Spoke access" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Revoke Spoke access" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Revoke access" }));
  expect(
    await screen.findByText("1 revoked. 1 could not be confirmed."),
  ).toBeVisible();
  expect(
    screen.getByText(/Treat this session as still authorised/),
  ).toBeVisible();
  failSecond = false;
  await userEvent.click(
    screen.getByRole("button", { name: "Retry failed sessions" }),
  );
  expect(
    await screen.findByText("2 revoked. 0 could not be confirmed."),
  ).toBeVisible();
  expect(vi.mocked(client.post).mock.calls.map(([path]) => path)).toEqual([
    "/admin/v1/app-access/sessions/one/revoke",
    "/admin/v1/app-access/sessions/two/revoke",
    "/admin/v1/app-access/sessions/two/revoke",
  ]);
  await userEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(screen.getByText("No active access")).toBeVisible();
});
