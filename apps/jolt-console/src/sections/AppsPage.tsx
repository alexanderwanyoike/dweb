import { useMemo, useState } from "react";
import { tauriDaemonClient, type DaemonClient } from "../daemon/client";
import type { AppSessionGrant } from "../daemon/types";
import { groupApplications, compareGrantRecency } from "../apps/model";
import { usePermissions } from "../apps/usePermissions";
import { RequestCard } from "../apps/RequestCard";
import { AppCard } from "../apps/AppCard";
import { RevokeDialog } from "../apps/RevokeDialog";
import "../apps/apps.css";
export function AppsPage({
  client = tauriDaemonClient,
  refreshIntervalMs = 5000,
}: {
  client?: DaemonClient;
  refreshIntervalMs?: number;
}) {
  const { resource, data, busy, loading, refreshing, error } = usePermissions(
    client,
    refreshIntervalMs,
  );
  const [selection, setSelection] = useState<{
    name: string;
    sessions: AppSessionGrant[];
  } | null>(null);
  const apps = useMemo(() => groupApplications(data.sessions), [data.sessions]);
  const pending = data.requests
    .filter((request) => request.status === "pending")
    .sort(compareGrantRecency);
  const history = data.requests
    .filter((request) => request.status === "rejected")
    .sort(compareGrantRecency);
  const renderRequest = (request: AppSessionGrant) => (
    <RequestCard
      key={request.request_id}
      request={request}
      identity={data.localIdentities.active_identity ?? null}
      busy={busy || refreshing || Boolean(error)}
      onApprove={() => resource.approve(request)}
      onReject={() => resource.reject(request)}
    />
  );
  return (
    <section className="apps-page" aria-label="App access">
      <header className="apps-intro">
        <div>
          <p className="eyebrow">YOU'RE IN CONTROL</p>
          <h2>Your apps, your permission.</h2>
          <p>
            See which apps can use your Jolt identity. Review or remove their
            access here.
          </p>
        </div>
        <button
          disabled={refreshing || busy}
          onClick={() => void resource.refresh()}
          aria-label="Refresh app access"
        >
          Refresh
        </button>
      </header>
      {error && (
        <div role="alert" className="access-error">
          Could not update app access: {error}. Refresh before making another
          access change.
        </div>
      )}
      {loading && <p role="status">Loading app access…</p>}
      <section className="apps-requests" aria-label="Requests">
        <h3 className="access-section-label">
          Requests <span>{pending.length}</span>
        </h3>
        {pending.length === 0 && !loading && !error && (
          <p className="access-muted">No app requests yet.</p>
        )}
        {pending.map(renderRequest)}
      </section>
      <section aria-label="Applications">
        <h3 className="access-section-label">
          Applications <span>{apps.length}</span>
        </h3>
        {!loading && !error && apps.length === 0 && (
          <div className="access-empty">
            <h3>A place for your apps.</h3>
            <p>When you connect an app to Jolt, its access appears here.</p>
          </div>
        )}
        <div className="access-app-list">
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              identities={data.localIdentities}
              busy={busy || refreshing || Boolean(error)}
              onRevoke={(name, sessions) => setSelection({ name, sessions })}
            />
          ))}
        </div>
      </section>
      {history.length > 0 && (
        <details className="access-history">
          <summary>Rejected requests ({history.length})</summary>
          {history.map(renderRequest)}
        </details>
      )}
      <p className="access-footnote">
        Apps are grouped by their reported app identifier. A familiar name is
        not proof of who published an app.
      </p>
      {selection && (
        <RevokeDialog
          {...selection}
          revoke={resource.revoke}
          onClose={() => setSelection(null)}
        />
      )}
    </section>
  );
}
