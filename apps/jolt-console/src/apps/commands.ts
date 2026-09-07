import type { DaemonClient } from "../daemon/client";
import type { AppSessionGrant } from "../daemon/types";
import { isGrantableCapability } from "./capabilities";
export type RevocationResult = {
  succeeded: AppSessionGrant[];
  failed: { session: AppSessionGrant; error: string }[];
};
export async function approveRequest(
  client: DaemonClient,
  request: AppSessionGrant,
) {
  if (
    request.status !== "pending" ||
    !request.requested_capabilities.every(isGrantableCapability)
  )
    throw new Error(
      "This request cannot be approved with its requested permissions.",
    );
  return client.post(
    `/admin/v1/app-requests/${encodeURIComponent(request.request_id)}/approve`,
    {
      identity: request.requested_identity ?? request.identity ?? null,
      capabilities: request.requested_capabilities,
      expires_at: null,
    },
  );
}
export function rejectRequest(client: DaemonClient, request: AppSessionGrant) {
  return client.post(
    `/admin/v1/app-requests/${encodeURIComponent(request.request_id)}/reject`,
  );
}
export async function revokeSessions(
  client: DaemonClient,
  sessions: AppSessionGrant[],
): Promise<RevocationResult> {
  const result: RevocationResult = { succeeded: [], failed: [] };
  for (const session of sessions.filter(
    (session) => session.status === "active",
  )) {
    try {
      if (!session.session_id)
        throw new Error(
          "This session has no revocation identifier. Refresh and try again.",
        );
      await client.post(
        `/admin/v1/app-access/sessions/${encodeURIComponent(session.session_id)}/revoke`,
      );
      result.succeeded.push(session);
    } catch (error) {
      result.failed.push({
        session,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return result;
}
