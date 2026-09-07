import { it, expect, vi } from "vitest";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
import { runNodeCommand } from "./node-commands";
it("refuses a control action when the node is now externally owned", async () => {
  const client = {
    status: vi.fn(async () => ({
      ownership: "external",
      reachability: "healthy",
    })),
    stop: vi.fn(),
    restart: vi.fn(),
    start: vi.fn(),
  } as unknown as DaemonLifecycleClient;
  await expect(runNodeCommand(client, "stop")).rejects.toThrow(
    "Console no longer owns",
  );
  await expect(runNodeCommand(client, "restart")).rejects.toThrow(
    "Console no longer owns",
  );
  expect(client.stop).not.toHaveBeenCalled();
  expect(client.restart).not.toHaveBeenCalled();
});
it("does not start a second node when the state changed before confirmation", async () => {
  const client = {
    status: vi.fn(async () => ({
      ownership: "console",
      reachability: "healthy",
    })),
    start: vi.fn(),
  } as unknown as DaemonLifecycleClient;
  await expect(runNodeCommand(client, "start")).rejects.toThrow(
    "state has changed",
  );
  expect(client.start).not.toHaveBeenCalled();
});
