import { useConsoleUpdates } from "../update/use-console-updates";
import type { ConsoleUpdateClient } from "../update/client";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render as renderView, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
import { SettingsPage } from "./SettingsPage";

const noUpdate: ConsoleUpdateClient = {
  check: async () => ({ available: false, currentVersion: "0.5.3" }),
  installAndRelaunch: vi.fn()
};
function SettingsHarness({
  lifecycleClient,
  updateClient = noUpdate
}: {
  lifecycleClient: DaemonLifecycleClient;
  updateClient?: ConsoleUpdateClient;
}) {
  const updates = useConsoleUpdates(updateClient, lifecycleClient);
  return <SettingsPage lifecycleClient={lifecycleClient} updates={updates} />;
}
function render(view: ReactNode) {
  return renderView(<MemoryRouter>{view}</MemoryRouter>);
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe("Console Settings", () => {
  it("renders daemon lifecycle ownership and runs allowed controls", async () => {
    const states = [
      {
        daemon_url: "http://127.0.0.1:9862",
        reachability: "unavailable",
        ownership: "none",
        message: "No local daemon is responding"
      },
      {
        daemon_url: "http://127.0.0.1:9862",
        reachability: "healthy",
        ownership: "external",
        pid: 4242,
        message: "Connected to an externally started daemon"
      },
      {
        daemon_url: "http://127.0.0.1:9862",
        reachability: "healthy",
        ownership: "console",
        pid: 4343,
        message: "Console owns this daemon"
      }
    ] as const;
    let statusIndex = 0;
    const lifecycleClient: DaemonLifecycleClient = {
      status: vi.fn(async () => states[Math.min(statusIndex, states.length - 1)]),
      start: vi.fn(async () => {
        statusIndex = 2;
        return states[2];
      }),
      stop: vi.fn(async () => {
        statusIndex = 0;
        return states[0];
      }),
      restart: vi.fn(async () => {
        statusIndex = 2;
        return states[2];
      })
    };

    render(<SettingsHarness lifecycleClient={lifecycleClient} />);

    expect(await screen.findByText("No local daemon is responding")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start node" }));
    expect(lifecycleClient.start).toHaveBeenCalledOnce();
    expect(await screen.findByText("Console owns this daemon")).toBeInTheDocument();

    statusIndex = 1;
    await userEvent.click(screen.getByRole("button", { name: "Refresh lifecycle" }));
    expect(
      await screen.findByText("Connected to an externally started daemon")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop node" })).toBeDisabled();
    expect(screen.getByText(/Console will not stop or restart it/)).toBeInTheDocument();

    statusIndex = 2;
    await userEvent.click(screen.getByRole("button", { name: "Refresh lifecycle" }));
    expect(await screen.findByText("Console owns this daemon")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Restart node" }));
    expect(lifecycleClient.restart).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Confirm restart" }));
    expect(lifecycleClient.restart).toHaveBeenCalledOnce();

    vi.mocked(lifecycleClient.stop).mockRejectedValueOnce(new Error("failed to terminate child"));
    await userEvent.click(screen.getByRole("button", { name: "Stop node" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm stop" }));
    expect(screen.getByText(/failed to terminate child/)).toBeInTheDocument();
  });

  it("installs a Console update after stopping a Console-owned daemon", async () => {
    const lifecycleClient: DaemonLifecycleClient = {
      status: vi.fn(async () => ({
        daemon_url: "http://127.0.0.1:9862",
        reachability: "healthy",
        ownership: "console",
        message: "Console owns this daemon"
      })),
      start: vi.fn(),
      stop: vi.fn(async () => ({
        daemon_url: "http://127.0.0.1:9862",
        reachability: "unavailable",
        ownership: "none",
        message: "Daemon stopped"
      })),
      restart: vi.fn()
    };

    const updateClient = {
      check: vi.fn(async () => ({
        available: true as const,
        version: "0.2.0",
        currentVersion: "0.1.0",
        notes: "Signed update artifacts are available."
      })),
      installAndRelaunch: vi.fn(async () => undefined)
    };

    render(<SettingsHarness lifecycleClient={lifecycleClient} updateClient={updateClient} />);

    expect(await screen.findByText("Update available")).toBeInTheDocument();
    expect(screen.getByText(/0.1.0 -> 0.2.0/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Install and restart" }));

    expect(updateClient.installAndRelaunch).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Confirm installation" }));
    expect(lifecycleClient.stop).toHaveBeenCalledOnce();
    expect(updateClient.installAndRelaunch).toHaveBeenCalledOnce();
    expect(vi.mocked(lifecycleClient.stop).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(updateClient.installAndRelaunch).mock.invocationCallOrder[0]
    );
  });

  it("installs a Console update without stopping an externally-owned daemon", async () => {
    const lifecycleClient: DaemonLifecycleClient = {
      status: vi.fn(async () => ({
        daemon_url: "http://127.0.0.1:9862",
        reachability: "healthy",
        ownership: "external",
        message: "Connected to an externally started daemon"
      })),
      start: vi.fn(),
      stop: vi.fn(),
      restart: vi.fn()
    };

    const updateClient = {
      check: vi.fn(async () => ({
        available: true as const,
        version: "0.2.0",
        currentVersion: "0.1.0"
      })),
      installAndRelaunch: vi.fn(async () => undefined)
    };

    render(<SettingsHarness lifecycleClient={lifecycleClient} updateClient={updateClient} />);

    expect(await screen.findByText("Update available")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Install and restart" }));

    expect(updateClient.installAndRelaunch).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Confirm installation" }));
    expect(lifecycleClient.stop).not.toHaveBeenCalled();
    expect(updateClient.installAndRelaunch).toHaveBeenCalledOnce();
  });
});

it("shows package-manager guidance without offering installation", async () => {
  const lifecycleClient = {
    status: vi.fn(async () => ({
      ownership: "external",
      reachability: "healthy",
      message: "External node"
    })),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn()
  } as DaemonLifecycleClient;
  const updateClient = {
    check: vi.fn(async () => ({
      available: false as const,
      managedByPackage: true
    })),
    installAndRelaunch: vi.fn()
  };
  render(<SettingsHarness lifecycleClient={lifecycleClient} updateClient={updateClient} />);
  expect(await screen.findByText("Updates come from your package manager")).toBeVisible();
  expect(screen.getByRole("button", { name: "Install and restart" })).toBeDisabled();
  expect(updateClient.installAndRelaunch).not.toHaveBeenCalled();
});

it("cancels a reviewed restart without controlling the node", async () => {
  const lifecycleClient = {
    status: vi.fn(async () => ({
      daemon_url: "localhost",
      ownership: "console",
      reachability: "healthy",
      message: "Started by Console"
    })),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn()
  } as DaemonLifecycleClient;
  render(<SettingsHarness lifecycleClient={lifecycleClient} />);
  await screen.findByText("Started by Console");
  await userEvent.click(screen.getByRole("button", { name: "Restart node" }));
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(lifecycleClient.restart).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
