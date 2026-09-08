import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadDaemonPayload,
  tauriDaemonClient,
  type DaemonClient,
} from "./client";
import { tauriDaemonLifecycleClient } from "./lifecycle";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("tauriDaemonClient", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("routes daemon reads through the Tauri daemon_get command", async () => {
    vi.mocked(invoke).mockResolvedValueOnce({ ok: true });

    await expect(tauriDaemonClient.get("/api/v1/status")).resolves.toEqual({
      ok: true,
    });
    expect(invoke).toHaveBeenCalledWith("daemon_get", {
      path: "/api/v1/status",
    });
  });

  it("routes daemon writes through the Tauri daemon_post command", async () => {
    vi.mocked(invoke).mockResolvedValueOnce({ ok: true });

    await expect(
      tauriDaemonClient.post("/admin/v1/app-requests/req_1/approve", {
        identity: "alice.jolt",
        capabilities: ["resolve:public"],
      }),
    ).resolves.toEqual({ ok: true });
    expect(invoke).toHaveBeenCalledWith("daemon_post", {
      path: "/admin/v1/app-requests/req_1/approve",
      body: {
        identity: "alice.jolt",
        capabilities: ["resolve:public"],
      },
    });
  });

  it("routes daemon deletes through the Tauri daemon_delete command", async () => {
    vi.mocked(invoke).mockResolvedValueOnce({ ok: true });

    await expect(
      tauriDaemonClient.delete!("/admin/v1/identities/work.jolt"),
    ).resolves.toEqual({
      ok: true,
    });
    expect(invoke).toHaveBeenCalledWith("daemon_delete", {
      path: "/admin/v1/identities/work.jolt",
    });
  });
});

describe("tauriDaemonLifecycleClient", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("routes lifecycle reads and actions through Tauri lifecycle commands", async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce({ ownership: "none" })
      .mockResolvedValueOnce({ ownership: "console" })
      .mockResolvedValueOnce({ ownership: "console" })
      .mockResolvedValueOnce({ ownership: "none" });

    await expect(tauriDaemonLifecycleClient.status()).resolves.toEqual({
      ownership: "none",
    });
    await expect(tauriDaemonLifecycleClient.start()).resolves.toEqual({
      ownership: "console",
    });
    await expect(tauriDaemonLifecycleClient.restart()).resolves.toEqual({
      ownership: "console",
    });
    await expect(tauriDaemonLifecycleClient.stop()).resolves.toEqual({
      ownership: "none",
    });

    expect(invoke).toHaveBeenNthCalledWith(1, "daemon_lifecycle_status");
    expect(invoke).toHaveBeenNthCalledWith(2, "daemon_lifecycle_start");
    expect(invoke).toHaveBeenNthCalledWith(3, "daemon_lifecycle_restart");
    expect(invoke).toHaveBeenNthCalledWith(4, "daemon_lifecycle_stop");
  });
});

describe("loadDaemonPayload", () => {
  it("loads status, peer inventory, cache inventory, and published content as one snapshot", async () => {
    const client: DaemonClient = {
      daemonUrl: "http://127.0.0.1:9862",
      get: vi.fn(async (path: string) => {
        if (path === "/api/v1/status") return { peer_id: "peer" };
        if (path === "/api/v1/peers") {
          return [
            {
              peer_id: "12D3KooPeer",
              is_relayed: false,
              transport: "tcp",
              remote_addr: "/ip4/127.0.0.1/tcp/4001",
            },
          ];
        }
        if (path === "/api/v1/cache/stats") return { total_cached: 10 };
        if (path === "/api/v1/cache/entries") {
          return [
            {
              content_id: "bafkcacheentry",
              size: 10,
              cached_at: 1_780_000_000,
              last_accessed: 1_780_000_100,
              pinned: true,
            },
          ];
        }
        if (path === "/api/v1/published") {
          return [
            { content_id: "cid", size: 1, address: "alice.jolt/demo" },
            { content_id: "other", size: 1, address: "work.jolt/demo" },
          ];
        }
        if (path === "/admin/v1/identities") {
          return {
            active_identity: "alice.jolt",
            identities: [
              { address: "alice.jolt", label: "Default", active: true },
            ],
          };
        }
        throw new Error(path);
      }),
      post: vi.fn(),
    };

    await expect(loadDaemonPayload(client)).resolves.toEqual({
      status: { peer_id: "peer" },
      peers: [
        {
          peer_id: "12D3KooPeer",
          is_relayed: false,
          transport: "tcp",
          remote_addr: "/ip4/127.0.0.1/tcp/4001",
        },
      ],
      cacheStats: { total_cached: 10 },
      cacheEntries: [
        {
          content_id: "bafkcacheentry",
          size: 10,
          cached_at: 1_780_000_000,
          last_accessed: 1_780_000_100,
          pinned: true,
        },
      ],
      published: [{ content_id: "cid", size: 1, address: "alice.jolt/demo" }],
      localIdentities: {
        active_identity: "alice.jolt",
        identities: [{ address: "alice.jolt", label: "Default", active: true }],
      },
    });
  });
});
