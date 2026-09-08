import { useState } from "react";
import type { LocalIdentitiesPayload } from "../daemon/types";
import {
  exactGrants,
  identityFor,
  identityGroups,
  permissionsDiffer,
  type AppAccess,
  type AppSessionGrant,
} from "./model";
import { SessionDetails } from "./SessionDetails";
import { sessionTimeLabel } from "./format";
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
  const groups = identityGroups(app.active);
  const sessionCount = app.active.length;
  const hasActiveAccess = sessionCount > 0;
  const accessStatus = hasActiveAccess ? "Access allowed" : "No active access";
  const sessionNoun = sessionCount === 1 ? "session" : "sessions";
  const identityNoun = groups.length === 1 ? "identity" : "identities";
  const accessSummary = `${sessionCount} authorised ${sessionNoun} · ${groups.length} ${identityNoun}`;
  const grants = exactGrants(app.active);
  const permissionsVary = permissionsDiffer(app.active);

  return (
    <article className="access-app">
      <div className="access-app-heading">
        <span className="app-monogram" aria-hidden="true">
          {app.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="access-app-copy">
          <h3>
            {app.name} <span className="status-label">{accessStatus}</span>
          </h3>
          <p>{accessSummary}</p>
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
            <p>Last used: {sessionTimeLabel(app.active[0]?.last_used_at)}</p>
            {hasActiveAccess && (
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
          {permissionsVary && (
            <p className="access-muted">
              Permissions differ between sessions. This list includes all
              authorised access; inspect a session for its exact grants.
            </p>
          )}
          {hasActiveAccess && (
            <details className="access-grant-summary">
              <summary>What this app can access</summary>
              <PermissionList grants={grants} />
            </details>
          )}
          {groups.map((group) => (
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
