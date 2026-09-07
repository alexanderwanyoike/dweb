import type { AppSessionGrant } from "./model";
import { PermissionList } from "./PermissionList";
import { sessionTimeLabel } from "./format";

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
          Last used: {sessionTimeLabel(session.last_used_at)}
          <br />
          Created: {sessionTimeLabel(session.created_at)}
        </p>
        {session.expires_at && (
          <p>Expires {sessionTimeLabel(session.expires_at)}</p>
        )}
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
