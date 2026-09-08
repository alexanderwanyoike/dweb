export type DaemonStatus = {
  daemon_version?: string;
  peer_id?: string;
  identity_address?: string;
  uptime_secs?: number;
  connected_peers?: number;
  direct_peers?: number;
  relayed_peers?: number;
  nat_type?: string;
  active_relays?: number;
  published_count?: number;
  cached_count?: number;
  bootstrap_state?: string;
  known_relay_count?: number;
  connected_bootstrap_peers?: number;
  home_relay?: {
    peer_id?: string;
    capability?: string;
    multiaddr?: string;
    api_url?: string;
  } | null;
};

export type CacheStats = {
  total_cached?: number;
  total_published?: number;
  cached_items?: number;
  published_items?: number;
  pinned_items?: number;
  pinned_size?: number;
  max_size?: number;
  available?: number;
};

export type PeerInfo = {
  peer_id: string;
  is_relayed: boolean;
  transport: string;
  remote_addr: string;
};

export type CacheEntry = {
  content_id: string;
  size: number;
  cached_at: number;
  last_accessed: number;
  pinned: boolean;
};

export type PublishedContent = {
  content_id: string;
  size: number;
  path?: string | null;
  address?: string | null;
  pin_state?: string;
  relay?: { peer_id?: string } | null;
};

export type LocalIdentity = {
  address: string;
  label?: string | null;
  active: boolean;
};

export type LocalIdentitiesPayload = {
  active_identity?: string | null;
  identities: LocalIdentity[];
};

export type IdentityExportBundle = {
  magic: string;
  version: number;
  identity: string;
  created_at: number;
  kdf: {
    name: string;
    params?: unknown;
    salt: string;
  };
  cipher: {
    name: string;
    nonce: string;
  };
  ciphertext: string;
};

export type IdentityExportResponse = {
  identity: string;
  encryption_key_count: number;
  bundle: IdentityExportBundle;
};

export type IdentityImportResponse = {
  identity: string;
  imported: boolean;
  restart_required: boolean;
  encryption_key_count: number;
  app_sessions_imported: boolean;
};

export type DaemonPayload = {
  status: DaemonStatus;
  peers: PeerInfo[];
  cacheStats: CacheStats;
  cacheEntries: CacheEntry[];
  published: PublishedContent[];
  localIdentities: LocalIdentitiesPayload;
};

export type HomeRelayConfig = {
  peer_id?: string;
  multiaddr: string;
  capability: string;
  api_url?: string | null;
};

export type NetworkSettingsPayload = {
  configured_bootstrap_relays: string[];
  built_in_bootstrap_relays: string[];
  effective_bootstrap_relays: string[];
  configured_bootstrap_relay_count: number;
  built_in_bootstrap_relay_count: number;
  effective_bootstrap_relay_count: number;
  use_builtin_bootstrap_relays: boolean;
  bootstrap_relay: boolean;
  home_relay: HomeRelayConfig | null;
};
