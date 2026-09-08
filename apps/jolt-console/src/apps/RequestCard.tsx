import { useState } from "react";
import type { AppSessionGrant } from "./model";
import { isGrantableCapability } from "./capabilities";
import { PermissionList } from "./PermissionList";

export function RequestCard({
  request,
  identity,
  busy,
  onApprove,
  onReject,
}: {
  request: AppSessionGrant;
  identity: string | null;
  busy: boolean;
  onApprove(): Promise<unknown>;
  onReject(): Promise<unknown>;
}) {
  const [expanded, setExpanded] = useState(false);
  const blocked = !request.requested_capabilities.every(isGrantableCapability);
  const actionable = request.status === "pending";
  const owner = request.requested_identity ?? identity ?? "the active identity";
  return (
    <article className="access-request">
      <div className="access-request-heading">
        <span className="app-monogram" aria-hidden="true">
          {request.app_name.slice(0, 1).toUpperCase()}
        </span>
        <button
          className="access-request-summary"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <strong>
            {request.app_name} wants access{" "}
            <span className="status-label">{request.status}</span>
          </strong>
          <span>
            For <span className="mono">{owner}</span>
          </span>
          <span>
            {request.requested_capabilities.length} requested permissions ·
            Review details
          </span>
          <span className="visually-hidden">request details</span>
        </button>
        <div className="access-actions">
          <button
            aria-label={`Reject ${request.app_name}`}
            disabled={busy || !actionable}
            onClick={() => void onReject().catch(() => {})}
          >
            Reject
          </button>
          <button
            className="access-primary"
            aria-label={`Approve ${request.app_name}`}
            disabled={busy || blocked || !actionable}
            onClick={() => void onApprove().catch(() => {})}
          >
            Approve
          </button>
        </div>
      </div>
      {expanded && (
        <div className="access-request-details">
          <p>
            <strong>{request.app_id}</strong>
            <br />
            <span className="mono">
              {request.app_origin || "Origin not reported"}
            </span>
          </p>
          <PermissionList grants={request.requested_capabilities} />
          {blocked && (
            <p className="access-error">
              This request includes permissions Console cannot approve.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
