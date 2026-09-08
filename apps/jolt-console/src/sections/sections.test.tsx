import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
function render(view: ReactNode) {
  return renderView(<MemoryRouter>{view}</MemoryRouter>);
}
import "@testing-library/jest-dom/vitest";
import { cleanup, render as renderView, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DaemonClient } from "../daemon/client";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import { SettingsPage } from "./SettingsPage";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

function snapshot(overrides: Partial<DaemonSnapshot> = {}): DaemonSnapshot {
  return {
    daemonUrl: "http://127.0.0.1:9862",
    connected: true,
    status: {
      identity_address: "alice.jolt",
      peer_id: "12D3KooAlice",
      uptime_secs: 3660,
      connected_peers: 3,
      direct_peers: 2,
      relayed_peers: 1,
      active_relays: 1,
      published_count: 1,
      cached_count: 4,
      bootstrap_state: "connected",
      known_relay_count: 2,
      connected_bootstrap_peers: 1,
      home_relay: {
        peer_id: "12D3KooRelay",
        capability: "pinning",
        multiaddr: "/ip4/127.0.0.1/tcp/4001/p2p/12D3KooRelay",
        api_url: "http://127.0.0.1:9870",
      },
    },
    peers: [
      {
        peer_id: "12D3KooPeer",
        is_relayed: false,
        transport: "tcp",
        remote_addr: "/ip4/127.0.0.1/tcp/4001",
      },
    ],
    cacheStats: {
      total_cached: 4096,
      total_published: 2048,
      pinned_items: 1,
      available: 8192,
    },
    cacheEntries: [
      {
        content_id: "bafkcacheentry",
        size: 512,
        cached_at: 1_780_000_000,
        last_accessed: 1_780_000_100,
        pinned: true,
      },
    ],
    published: [
      {
        content_id: "bafkexamplecid000000000000000001",
        path: "/demo/post",
        size: 42,
        pin_state: "pinned",
      },
    ],
    localIdentities: {
      active_identity: "alice.jolt",
      identities: [
        { address: "alice.jolt", label: "Default", active: true },
        { address: "work.jolt", label: "Work", active: false },
      ],
    },
    lastError: null,
    lastRefresh: new Date("2026-06-03T21:00:00Z"),
    refresh: vi.fn(async () => undefined),
    ...overrides,
  };
}

function daemonClient(): DaemonClient {
  return {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(),
    post: vi.fn(async () => ({
      active_identity: "work.jolt",
      identities: [
        { address: "alice.jolt", label: "Default", active: false },
        { address: "work.jolt", label: "Work", active: true },
      ],
    })),
    delete: vi.fn(async () => ({
      active_identity: "alice.jolt",
      identities: [{ address: "alice.jolt", label: "Default", active: true }],
    })),
  };
}

describe("Console section pages", () => {
  it("renders daemon lifecycle ownership and runs allowed controls", async () => {
    const states = [
      {
        daemon_url: "http://127.0.0.1:9862",
        reachability: "unavailable",
        ownership: "none",
        message: "No local daemon is responding",
      },
      {
        daemon_url: "http://127.0.0.1:9862",
        reachability: "healthy",
        ownership: "external",
        pid: 4242,
        message: "Connected to an externally started daemon",
      },
      {
        daemon_url: "http://127.0.0.1:9862",
        reachability: "healthy",
        ownership: "console",
        pid: 4343,
        message: "Console owns this daemon",
      },
    ] as const;
    let statusIndex = 0;
    const lifecycleClient: DaemonLifecycleClient = {
      status: vi.fn(
        async () => states[Math.min(statusIndex, states.length - 1)],
      ),
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
      }),
    };
    const daemonClient: DaemonClient = {
      daemonUrl: "http://127.0.0.1:9862",
      get: vi.fn(async (path: string) => {
        if (path === "/admin/v1/network-settings") {
          return {
            configured_bootstrap_relays: [],
            built_in_bootstrap_relays: [],
            effective_bootstrap_relays: [],
            configured_bootstrap_relay_count: 0,
            built_in_bootstrap_relay_count: 0,
            effective_bootstrap_relay_count: 0,
            use_builtin_bootstrap_relays: true,
            bootstrap_relay: false,
            home_relay: null,
          };
        }
        if (path === "/api/v1/status") return {};
        throw new Error(path);
      }),
      post: vi.fn(),
    };

    render(
      <SettingsPage
        lifecycleClient={lifecycleClient}
        daemonClient={daemonClient}
      />,
    );

    expect(
      await screen.findByText("No local daemon is responding"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start daemon" }));
    expect(lifecycleClient.start).toHaveBeenCalledOnce();
    expect(
      await screen.findByText("Console owns this daemon"),
    ).toBeInTheDocument();

    statusIndex = 1;
    await userEvent.click(
      screen.getByRole("button", { name: "Refresh lifecycle" }),
    );
    expect(
      await screen.findByText("Connected to an externally started daemon"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop daemon" })).toBeDisabled();
    expect(
      screen.getByText(/Console will not stop or restart it/),
    ).toBeInTheDocument();

    statusIndex = 2;
    await userEvent.click(
      screen.getByRole("button", { name: "Refresh lifecycle" }),
    );
    expect(
      await screen.findByText("Console owns this daemon"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Restart daemon" }),
    );
    expect(lifecycleClient.restart).toHaveBeenCalledOnce();

    vi.mocked(lifecycleClient.stop).mockRejectedValueOnce(
      new Error("failed to terminate child"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Stop daemon" }));
    expect(screen.getByText(/failed to terminate child/)).toBeInTheDocument();
  });

  it("installs a Console update after stopping a Console-owned daemon", async () => {
    const lifecycleClient: DaemonLifecycleClient = {
      status: vi.fn(async () => ({
        daemon_url: "http://127.0.0.1:9862",
        reachability: "healthy",
        ownership: "console",
        message: "Console owns this daemon",
      })),
      start: vi.fn(),
      stop: vi.fn(async () => ({
        daemon_url: "http://127.0.0.1:9862",
        reachability: "unavailable",
        ownership: "none",
        message: "Daemon stopped",
      })),
      restart: vi.fn(),
    };
    const daemonClient: DaemonClient = {
      daemonUrl: "http://127.0.0.1:9862",
      get: vi.fn(async (path: string) => {
        if (path === "/admin/v1/network-settings") {
          return {
            configured_bootstrap_relays: [],
            built_in_bootstrap_relays: [],
            effective_bootstrap_relays: [],
            configured_bootstrap_relay_count: 0,
            built_in_bootstrap_relay_count: 0,
            effective_bootstrap_relay_count: 0,
            use_builtin_bootstrap_relays: true,
            bootstrap_relay: false,
            home_relay: null,
          };
        }
        if (path === "/api/v1/status") return {};
        throw new Error(path);
      }),
      post: vi.fn(),
    };
    const updateClient = {
      check: vi.fn(async () => ({
        available: true as const,
        version: "0.2.0",
        currentVersion: "0.1.0",
        notes: "Signed update artifacts are available.",
      })),
      installAndRelaunch: vi.fn(async () => undefined),
    };

    render(
      <SettingsPage
        lifecycleClient={lifecycleClient}
        daemonClient={daemonClient}
        updateClient={updateClient}
      />,
    );

    expect(await screen.findByText("Update available")).toBeInTheDocument();
    expect(screen.getByText(/0.1.0 -> 0.2.0/)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Install and restart" }),
    );

    expect(lifecycleClient.stop).toHaveBeenCalledOnce();
    expect(updateClient.installAndRelaunch).toHaveBeenCalledOnce();
    expect(
      vi.mocked(lifecycleClient.stop).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(updateClient.installAndRelaunch).mock.invocationCallOrder[0],
    );
  });

  it("installs a Console update without stopping an externally-owned daemon", async () => {
    const lifecycleClient: DaemonLifecycleClient = {
      status: vi.fn(async () => ({
        daemon_url: "http://127.0.0.1:9862",
        reachability: "healthy",
        ownership: "external",
        message: "Connected to an externally started daemon",
      })),
      start: vi.fn(),
      stop: vi.fn(),
      restart: vi.fn(),
    };
    const daemonClient: DaemonClient = {
      daemonUrl: "http://127.0.0.1:9862",
      get: vi.fn(async (path: string) => {
        if (path === "/admin/v1/network-settings") {
          return {
            configured_bootstrap_relays: [],
            built_in_bootstrap_relays: [],
            effective_bootstrap_relays: [],
            configured_bootstrap_relay_count: 0,
            built_in_bootstrap_relay_count: 0,
            effective_bootstrap_relay_count: 0,
            use_builtin_bootstrap_relays: true,
            bootstrap_relay: false,
            home_relay: null,
          };
        }
        if (path === "/api/v1/status") return {};
        throw new Error(path);
      }),
      post: vi.fn(),
    };
    const updateClient = {
      check: vi.fn(async () => ({
        available: true as const,
        version: "0.2.0",
        currentVersion: "0.1.0",
      })),
      installAndRelaunch: vi.fn(async () => undefined),
    };

    render(
      <SettingsPage
        lifecycleClient={lifecycleClient}
        daemonClient={daemonClient}
        updateClient={updateClient}
      />,
    );

    expect(await screen.findByText("Update available")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Install and restart" }),
    );

    expect(lifecycleClient.stop).not.toHaveBeenCalled();
    expect(updateClient.installAndRelaunch).toHaveBeenCalledOnce();
  });

  it("starts the node without loading relay configuration in Settings", async () => {
    let started = false;
    const relay =
      "/ip4/89.167.68.65/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN";
    const lifecycleClient: DaemonLifecycleClient = {
      status: vi.fn(async () =>
        started
          ? {
              daemon_url: "http://127.0.0.1:9862",
              reachability: "healthy",
              ownership: "console",
              message: "Console owns this daemon",
            }
          : {
              daemon_url: "http://127.0.0.1:9862",
              reachability: "unavailable",
              ownership: "none",
              message: "No local daemon is responding",
            },
      ),
      start: vi.fn(async () => {
        started = true;
        return {
          daemon_url: "http://127.0.0.1:9862",
          reachability: "healthy",
          ownership: "console",
          message: "Console owns this daemon",
        };
      }),
      stop: vi.fn(),
      restart: vi.fn(),
    };
    const daemonClient: DaemonClient = {
      daemonUrl: "http://127.0.0.1:9862",
      get: vi.fn(async (path: string) => {
        if (!started) throw new Error("daemon offline");
        if (path === "/admin/v1/network-settings") {
          return {
            configured_bootstrap_relays: [relay],
            built_in_bootstrap_relays: [],
            effective_bootstrap_relays: [relay],
            configured_bootstrap_relay_count: 1,
            built_in_bootstrap_relay_count: 0,
            effective_bootstrap_relay_count: 1,
            use_builtin_bootstrap_relays: true,
            bootstrap_relay: false,
            home_relay: null,
          };
        }
        if (path === "/api/v1/status") {
          return {
            bootstrap_state: "connected",
            connected_bootstrap_peers: 1,
            known_relay_count: 2,
          };
        }
        throw new Error(path);
      }),
      post: vi.fn(),
    };

    render(
      <SettingsPage
        lifecycleClient={lifecycleClient}
        daemonClient={daemonClient}
      />,
    );

    expect(
      await screen.findByText("No local daemon is responding"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Start daemon" }));

    expect(
      await screen.findByText("Console owns this daemon"),
    ).toBeInTheDocument();
    expect(daemonClient.get).not.toHaveBeenCalled();
    expect(screen.queryByText(/daemon offline/)).not.toBeInTheDocument();
  });
});
