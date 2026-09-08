import { tauriDaemonClient, type DaemonClient } from "../daemon/client";
import type { LocalIdentitiesPayload } from "../daemon/types";
import type { AppAccessData, AppSessionGrant, RevocationResult } from "./model";
import { isGrantableCapability } from "./capabilities";

export function createAppAccessGateway(client: DaemonClient) {
  return {
    load: () => loadAppAccess(client),
    approve: (request: AppSessionGrant) => approveRequest(client, request),
    reject: (request: AppSessionGrant) => rejectRequest(client, request),
    revoke: (sessions: AppSessionGrant[]) => revokeSessions(client, sessions)
  };
}

export type AppAccessGateway = ReturnType<typeof createAppAccessGateway>;
export const tauriAppAccessGateway = createAppAccessGateway(tauriDaemonClient);

async function loadAppAccess(client: DaemonClient): Promise<AppAccessData> {
  const [requests, sessions, localIdentities] = await Promise.all([
    client.get<AppSessionGrant[]>("/admin/v1/app-access/requests"),
    client.get<AppSessionGrant[]>("/admin/v1/app-access/sessions"),
    client.get<LocalIdentitiesPayload>("/admin/v1/identities")
  ]);

  return { requests, sessions, localIdentities };
}

async function approveRequest(client: DaemonClient, request: AppSessionGrant) {
  if (request.status !== "pending" || !request.requested_capabilities.every(isGrantableCapability))
    throw new Error("This request cannot be approved with its requested permissions.");
  return client.post(`/admin/v1/app-requests/${encodeURIComponent(request.request_id)}/approve`, {
    identity: request.requested_identity ?? request.identity ?? null,
    capabilities: request.requested_capabilities,
    expires_at: null
  });
}

function rejectRequest(client: DaemonClient, request: AppSessionGrant) {
  return client.post(`/admin/v1/app-requests/${encodeURIComponent(request.request_id)}/reject`);
}

async function revokeSessions(
  client: DaemonClient,
  sessions: AppSessionGrant[]
): Promise<RevocationResult> {
  const result: RevocationResult = { succeeded: [], failed: [] };
  for (const session of sessions.filter((session) => session.status === "active")) {
    try {
      if (!session.session_id)
        throw new Error("This session has no revocation identifier. Refresh and try again.");
      await client.post(
        `/admin/v1/app-access/sessions/${encodeURIComponent(session.session_id)}/revoke`
      );
      result.succeeded.push(session);
    } catch (error) {
      result.failed.push({
        session,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return result;
}
