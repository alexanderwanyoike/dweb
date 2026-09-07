import type { AppSessionGrant } from "../daemon/types";
import { PermissionList } from "./PermissionList";
export function timeLabel(seconds?: number | null) {
  if (!seconds) return "Never used";
  return new Date(seconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
export function SessionDetails({
  session,
  busy,
  onRevoke,
}: {
  session: AppSessionGrant;
  busy: boolean;
  onRevoke(session: AppSessionGrant): void;
}) {
  return (
    <details className="access-session">
      <summary>
        <span>{session.app_origin || "Origin not reported"}</span>
        <span className="status-label">{session.status}</span>
      </summary>
      <div className="access-session-body">
        <p className="access-muted">
          Last used: {timeLabel(session.last_used_at)}
          <br />
          Created: {timeLabel(session.created_at)}
        </p>
        {session.expires_at && <p>Expires {timeLabel(session.expires_at)}</p>}
        <p className="mono">Session {session.session_id || "not reported"}</p>
        <PermissionList grants={session.granted_capabilities} />
        {session.status === "active" && (
          <button
            className="access-danger"
            disabled={busy}
            onClick={() => onRevoke(session)}
          >
            Revoke this session
          </button>
        )}
      </div>
    </details>
  );
}
