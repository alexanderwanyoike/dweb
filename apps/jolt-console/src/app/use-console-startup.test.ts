import { renderHook, act } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import type { DaemonLifecycleClient, DaemonLifecycleState } from "../daemon/lifecycle";
import { useConsoleStartup } from "./use-console-startup";
it("does not start a node after Console closes during its initial status check", async () => {
  let resolve!: (state: DaemonLifecycleState) => void;
  const status = new Promise<DaemonLifecycleState>((done) => {
    resolve = done;
  });
  const client = {
    status: vi.fn(() => status),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn()
  };
  const view = renderHook(() => useConsoleStartup(client, vi.fn()));
  view.unmount();
  await act(async () => {
    resolve({
      daemon_url: "localhost",
      ownership: "none",
      reachability: "unavailable",
      message: "Stopped"
    });
    await status;
  });
  expect(client.start).not.toHaveBeenCalled();
});
