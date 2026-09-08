import { renderHook, waitFor, act, cleanup } from "@testing-library/react";
import { it, expect, vi, afterEach } from "vitest";
import { useConsoleUpdates } from "./use-console-updates";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
afterEach(cleanup);
it("does not install if stopping its owned node fails", async () => {
  const client = {
    check: vi.fn(async () => ({
      available: true as const,
      currentVersion: "1",
      version: "2"
    })),
    installAndRelaunch: vi.fn()
  };
  const lifecycle = {
    status: vi.fn(async () => ({ ownership: "console" })),
    stop: vi.fn(async () => {
      throw new Error("Could not stop");
    })
  } as unknown as DaemonLifecycleClient;
  const { result } = renderHook(() => useConsoleUpdates(client, lifecycle));
  await waitFor(() => expect(result.current.check?.available).toBe(true));
  await act(async () => {
    await result.current.install();
  });
  expect(client.installAndRelaunch).not.toHaveBeenCalled();
  expect(result.current.error).toBe("Could not stop");
});
