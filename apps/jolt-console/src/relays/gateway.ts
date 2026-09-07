import type { DaemonClient } from "../daemon/client";
import type { NetworkSettingsPayload, HomeRelayConfig } from "../daemon/types";
export async function loadNetworkSettings(
  client: DaemonClient,
): Promise<NetworkSettingsPayload> {
  return client.get<NetworkSettingsPayload>("/admin/v1/network-settings");
}

export async function addBootstrapRelay(
  client: DaemonClient,
  multiaddr: string,
): Promise<NetworkSettingsPayload> {
  return client.post<NetworkSettingsPayload>("/admin/v1/bootstrap-relays", {
    multiaddr,
  });
}

export async function removeBootstrapRelay(
  client: DaemonClient,
  multiaddr: string,
): Promise<NetworkSettingsPayload> {
  return client.post<NetworkSettingsPayload>(
    "/admin/v1/bootstrap-relays/remove",
    { multiaddr },
  );
}

export async function setHomeRelay(
  client: DaemonClient,
  request: Pick<HomeRelayConfig, "multiaddr" | "capability" | "api_url">,
): Promise<NetworkSettingsPayload> {
  return client.post<NetworkSettingsPayload>("/admin/v1/home-relay", request);
}

export async function clearHomeRelay(
  client: DaemonClient,
): Promise<NetworkSettingsPayload> {
  return client.post<NetworkSettingsPayload>("/admin/v1/home-relay/clear");
}

export function createRelayGateway(client: DaemonClient) {
  return {
    load: () => loadNetworkSettings(client),
    add: (address: string) => addBootstrapRelay(client, address),
    remove: (address: string) => removeBootstrapRelay(client, address),
    setHome: (
      relay: Pick<HomeRelayConfig, "multiaddr" | "api_url" | "capability">,
    ) => setHomeRelay(client, relay),
    clearHome: () => clearHomeRelay(client),
  };
}
export type RelayGateway = ReturnType<typeof createRelayGateway>;
