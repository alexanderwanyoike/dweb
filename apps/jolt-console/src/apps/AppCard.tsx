import { useState } from "react";
import type { AppSessionGrant, LocalIdentitiesPayload } from "../daemon/types";
import {
  exactGrants,
  identityFor,
  identityGroups,
  permissionsDiffer,
  type AppAccess,
} from "./model";
import { SessionDetails, timeLabel } from "./SessionDetails";
import { IdentitySessions } from "./IdentitySessions";
import { PermissionList } from "./PermissionList";
export function AppCard({
  app,
  identities,
  busy,
  onRevoke,
}: {
  app: AppAccess;
  identities: LocalIdentitiesPayload;
  busy: boolean;
  onRevoke(name: string, sessions: AppSessionGrant[]): void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="access-app">
      <div className="access-app-heading">
        <span className="app-monogram" aria-hidden="true">
          {app.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="access-app-copy">
          <h3>
            {app.name}{" "}
            <span className="status-label">
              {app.active.length ? "Access allowed" : "No active access"}
            </span>
          </h3>
          <p>
            {app.active.length} authorised{" "}
            {app.active.length === 1 ? "session" : "sessions"} ·{" "}
            {identityGroups(app.active).length}{" "}
            {identityGroups(app.active).length === 1
              ? "identity"
              : "identities"}
          </p>
          <small>{app.id}</small>
        </div>
        <button
          aria-label={`Manage ${app.name} access`}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          Manage access <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </button>
      </div>
      {expanded && (
        <div className="access-app-details">
          <div className="access-detail-heading">
            <p>Last used: {timeLabel(app.active[0]?.last_used_at)}</p>
            {app.active.length > 0 && (
              <button
                className="access-danger"
                disabled={busy}
                onClick={() => onRevoke(app.name, app.active)}
                aria-label={`Revoke ${app.name} access`}
              >
                Revoke app access
              </button>
            )}
          </div>
          {permissionsDiffer(app.active) && (
            <p className="access-muted">
              Permissions differ between sessions. This list includes all
              authorised access; inspect a session for its exact grants.
            </p>
          )}
          {app.active.length > 0 && (
            <details className="access-grant-summary">
              <summary>What this app can access</summary>
              <PermissionList grants={exactGrants(app.active)} />
            </details>
          )}
          {identityGroups(app.active).map((group) => (
            <IdentitySessions
              key={group.identity}
              {...group}
              identities={identities}
              busy={busy}
              onRevoke={(session) => onRevoke(app.name, [session])}
            />
          ))}
          {app.history.length > 0 && (
            <details className="access-history">
              <summary>
                Revoked and expired history ({app.history.length})
              </summary>
              {app.history.map((session) => (
                <div key={session.session_id || session.request_id}>
                  <p className="mono">{identityFor(session)}</p>
                  <SessionDetails
                    session={session}
                    busy={busy}
                    onRevoke={() => {}}
                  />
                </div>
              ))}
            </details>
          )}
        </div>
      )}
    </article>
  );
}
