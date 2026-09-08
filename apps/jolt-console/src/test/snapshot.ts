import { vi } from "vitest";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
export function snapshot(overrides: Partial<DaemonSnapshot> = {}): DaemonSnapshot {
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
        api_url: "http://127.0.0.1:9870"
      }
    },
    peers: [
      {
        peer_id: "12D3KooPeer",
        is_relayed: false,
        transport: "tcp",
        remote_addr: "/ip4/127.0.0.1/tcp/4001"
      }
    ],
    cacheStats: {
      total_cached: 4096,
      total_published: 2048,
      pinned_items: 1,
      available: 8192
    },
    cacheEntries: [
      {
        content_id: "bafkcacheentry",
        size: 512,
        cached_at: 1_780_000_000,
        last_accessed: 1_780_000_100,
        pinned: true
      }
    ],
    published: [
      {
        content_id: "bafkexamplecid000000000000000001",
        path: "/demo/post",
        size: 42,
        pin_state: "pinned"
      }
    ],
    localIdentities: {
      active_identity: "alice.jolt",
      identities: [
        { address: "alice.jolt", label: "Default", active: true },
        { address: "work.jolt", label: "Work", active: false }
      ]
    },
    lastError: null,
    lastRefresh: new Date("2026-06-03T21:00:00Z"),
    refresh: vi.fn(async () => true),
    ...overrides
  };
}
