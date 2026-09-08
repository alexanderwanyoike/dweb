import type { DaemonClient } from "../daemon/client";
import type {
  IdentityExportBundle,
  IdentityExportResponse,
  IdentityImportResponse,
  LocalIdentity,
  LocalIdentitiesPayload,
} from "../daemon/types";
export async function createLocalIdentity(
  client: DaemonClient,
  label?: string,
): Promise<LocalIdentity> {
  return client.post<LocalIdentity>("/admin/v1/identities", {
    label: label || null,
  });
}

export async function selectLocalIdentity(
  client: DaemonClient,
  identity: string,
): Promise<LocalIdentitiesPayload> {
  return client.post<LocalIdentitiesPayload>("/admin/v1/identities/active", {
    identity,
  });
}

export async function deleteLocalIdentity(
  client: DaemonClient,
  identity: string,
): Promise<LocalIdentitiesPayload> {
  if (!client.delete) {
    throw new Error("Daemon client does not support identity deletion");
  }
  return client.delete<LocalIdentitiesPayload>(
    `/admin/v1/identities/${encodeURIComponent(identity)}`,
  );
}

export async function exportIdentity(
  client: DaemonClient,
  passphrase: string,
  label?: string,
  identity?: string,
): Promise<IdentityExportResponse> {
  const body: {
    passphrase: string | null;
    label: string | null;
    identity?: string;
  } = {
    passphrase: passphrase || null,
    label: label || null,
  };
  if (identity) {
    body.identity = identity;
  }
  return client.post<IdentityExportResponse>(
    "/admin/v1/identities/export",
    body,
  );
}

export async function importIdentity(
  client: DaemonClient,
  bundle: IdentityExportBundle,
  passphrase: string,
  allowOverwrite: boolean,
  asLocalIdentity = false,
): Promise<IdentityImportResponse> {
  return client.post<IdentityImportResponse>("/admin/v1/identities/import", {
    passphrase: passphrase || null,
    bundle,
    allow_overwrite: allowOverwrite,
    as_local_identity: asLocalIdentity,
  });
}

export function createIdentityGateway(client: DaemonClient) {
  return {
    create: (name: string) => createLocalIdentity(client, name),
    select: (identity: string) => selectLocalIdentity(client, identity),
    remove: (identity: string) => deleteLocalIdentity(client, identity),
    backup: (identity: string, passphrase: string, label: string) =>
      exportIdentity(client, passphrase, label, identity),
    restore: (bundle: IdentityExportBundle, passphrase: string) =>
      importIdentity(client, bundle, passphrase, false, true),
  };
}
export type IdentityGateway = ReturnType<typeof createIdentityGateway>;
