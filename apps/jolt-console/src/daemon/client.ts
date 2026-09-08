import { invoke } from "@tauri-apps/api/core";
import type {
  CacheEntry,
  CacheStats,
  DaemonPayload,
  DaemonStatus,
  LocalIdentitiesPayload,
  PeerInfo,
  PublishedContent
} from "./types";

export const DEFAULT_DAEMON_URL = "http://127.0.0.1:9862";

export type DaemonClient = {
  daemonUrl: string;
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  delete?<T>(path: string): Promise<T>;
};

export const tauriDaemonClient: DaemonClient = {
  daemonUrl: DEFAULT_DAEMON_URL,
  get<T>(path: string) {
    return invoke<T>("daemon_get", { path });
  },
  post<T>(path: string, body?: unknown) {
    return invoke<T>("daemon_post", { path, body });
  },
  delete<T>(path: string) {
    return invoke<T>("daemon_delete", { path });
  }
};

export async function loadDaemonPayload(client: DaemonClient): Promise<DaemonPayload> {
  const [status, peers, cacheStats, cacheEntries, published, localIdentities] = await Promise.all([
    client.get<DaemonStatus>("/api/v1/status"),
    client.get<PeerInfo[]>("/api/v1/peers"),
    client.get<CacheStats>("/api/v1/cache/stats"),
    client.get<CacheEntry[]>("/api/v1/cache/entries"),
    client.get<PublishedContent[]>("/api/v1/published"),
    client.get<LocalIdentitiesPayload>("/admin/v1/identities")
  ]);

  return {
    status,
    peers,
    cacheStats,
    cacheEntries,
    published: filterPublishedForActiveIdentity(published, localIdentities.active_identity),
    localIdentities
  };
}

function filterPublishedForActiveIdentity(
  published: PublishedContent[],
  activeIdentity?: string | null
): PublishedContent[] {
  if (!activeIdentity) return published;
  const addressPrefix = `${activeIdentity}/`;
  return published.filter((item) => item.address?.startsWith(addressPrefix));
}
