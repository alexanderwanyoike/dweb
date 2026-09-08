import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
import { AdvancedPage } from "./AdvancedPage";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("opens Advanced directly on the daemon log and refreshes the real output", async () => {
  vi.useFakeTimers();
  const status = vi.fn().mockResolvedValue({
    ownership: "console",
    reachability: "healthy",
    message: "Running",
    log_tail: ["node started"]
  });
  const client = { status } as unknown as DaemonLifecycleClient;
  render(
    <MemoryRouter initialEntries={["/advanced"]}>
      <AdvancedPage lifecycleClient={client} />
    </MemoryRouter>
  );
  await act(async () => {});
  expect(screen.getByRole("region", { name: "Daemon log output" })).toHaveTextContent(
    "node started"
  );
  expect(screen.getByRole("link", { name: "Relays" })).toHaveAttribute("href", "/relays");
  status.mockResolvedValue({
    ownership: "console",
    reachability: "healthy",
    message: "Running",
    log_tail: ["node started", "peer connected"]
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(screen.getByRole("region", { name: "Daemon log output" })).toHaveTextContent(
    "peer connected"
  );
  cleanup();
  const calls = status.mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6000);
  });
  expect(status).toHaveBeenCalledTimes(calls);
});

it("explains why an externally managed node has no captured output", async () => {
  const client = {
    status: vi.fn().mockResolvedValue({
      ownership: "external",
      reachability: "healthy",
      message: "Managed elsewhere",
      log_tail: []
    })
  } as unknown as DaemonLifecycleClient;
  render(
    <MemoryRouter>
      <AdvancedPage lifecycleClient={client} />
    </MemoryRouter>
  );
  expect(await screen.findByText(/started outside Console/)).toBeVisible();
});
