import { describe, it, vi, expect } from "vitest";
import type { DaemonClient } from "../daemon/client";
import {
  addBootstrapRelay,
  clearHomeRelay,
  loadNetworkSettings,
  removeBootstrapRelay,
  setHomeRelay
} from "./gateway";
describe("network settings helpers", () => {
  it("routes network settings through admin-only daemon endpoints", async () => {
    const payload = {
      configured_bootstrap_relays: [],
      built_in_bootstrap_relays: [],
      effective_bootstrap_relays: [],
      configured_bootstrap_relay_count: 0,
      built_in_bootstrap_relay_count: 0,
      effective_bootstrap_relay_count: 0,
      use_builtin_bootstrap_relays: true,
      bootstrap_relay: false,
      home_relay: null
    };
    const client: DaemonClient = {
      daemonUrl: "http://127.0.0.1:9862",
      get: vi.fn(async (path: string) => {
        if (path === "/admin/v1/network-settings") return payload;
        throw new Error(path);
      }),
      post: vi.fn(async () => payload)
    };
    const relay = "/ip4/127.0.0.1/tcp/4001/p2p/12D3KooRelay";

    await expect(loadNetworkSettings(client)).resolves.toEqual(payload);
    await addBootstrapRelay(client, relay);
    await removeBootstrapRelay(client, relay);
    await setHomeRelay(client, {
      multiaddr: relay,
      capability: "pinning",
      api_url: "http://127.0.0.1:9870"
    });
    await clearHomeRelay(client);

    expect(client.get).toHaveBeenCalledWith("/admin/v1/network-settings");
    expect(client.post).toHaveBeenNthCalledWith(1, "/admin/v1/bootstrap-relays", {
      multiaddr: relay
    });
    expect(client.post).toHaveBeenNthCalledWith(2, "/admin/v1/bootstrap-relays/remove", {
      multiaddr: relay
    });
    expect(client.post).toHaveBeenNthCalledWith(3, "/admin/v1/home-relay", {
      multiaddr: relay,
      capability: "pinning",
      api_url: "http://127.0.0.1:9870"
    });
    expect(client.post).toHaveBeenNthCalledWith(4, "/admin/v1/home-relay/clear");
  });
});
