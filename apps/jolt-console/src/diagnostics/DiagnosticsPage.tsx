import { DaemonLog } from "./DaemonLog";
import { useDaemonMonitor } from "../daemon/use-daemon-monitor";
import { useState } from "react";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import { tauriDaemonLifecycleClient, type DaemonLifecycleClient } from "../daemon/lifecycle";
import { AdvancedNav } from "../advanced";
import { TaskSection, TaskRow } from "../components/TaskSection";
import { SnapshotNotice } from "../components/SnapshotNotice";
import { Dialog } from "../components/Dialog";
import { errorMessage } from "../utils/use-action";
import { CONSOLE_VERSION } from "../version";
export function DiagnosticsPage({
  snapshot,
  lifecycleClient = tauriDaemonLifecycleClient
}: {
  snapshot: DaemonSnapshot;
  lifecycleClient?: DaemonLifecycleClient;
}) {
  const monitor = useDaemonMonitor(lifecycleClient);
  const lifecycle = monitor.state;
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const details = JSON.stringify(
    {
      console_version: CONSOLE_VERSION,
      daemon_url: snapshot.daemonUrl,
      last_checked: snapshot.lastRefresh,
      status: snapshot.status,
      peers: snapshot.peers,
      error: snapshot.lastError,
      lifecycle
    },
    null,
    2
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(review ?? "");
      setCopied(true);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }
  return (
    <div className="feature-page">
      <AdvancedNav />
      <SnapshotNotice snapshot={snapshot} />
      <TaskSection title="Local process">
        <TaskRow title="Connection" description={snapshot.daemonUrl} />
        <TaskRow
          title="Versions"
          description={`Console ${CONSOLE_VERSION} · Node ${snapshot.status?.daemon_version ?? "Not reported"}`}
        />
        {lifecycle && (
          <TaskRow
            title={lifecycle.message}
            description={`Ownership: ${lifecycle.ownership} · PID: ${lifecycle.pid ?? "Not reported"}`}
          />
        )}{" "}
        {error && <p role="alert">{error}</p>}
      </TaskSection>
      <TaskSection title="Connected peers">
        {snapshot.peers.map((peer) => (
          <TaskRow
            key={peer.peer_id}
            title={peer.peer_id}
            description={<span className="mono">{peer.remote_addr}</span>}
          >
            <span>{peer.is_relayed ? "relayed" : peer.transport}</span>
          </TaskRow>
        ))}
        {!snapshot.peers.length && (
          <p className="task-help">No connected peers currently reported.</p>
        )}
      </TaskSection>
      <DaemonLog
        state={lifecycle}
        error={monitor.error}
        busy={monitor.busy}
        onRefresh={monitor.refresh}
      />
      <details className="task-disclosure">
        <summary>Raw connection state</summary>
        <pre className="diagnostics-output">{details}</pre>
      </details>
      <div>
        <button
          onClick={() => {
            setCopied(false);
            setReview(details);
          }}
        >
          Prepare support details
        </button>
      </div>
      {review && (
        <Dialog title="Review support details" onClose={() => setReview(null)}>
          <p>
            This excerpt includes node identifiers, addresses and available logs. Review it before
            copying. Nothing is sent automatically.
          </p>
          <pre className="diagnostics-output">{review}</pre>
          <button onClick={() => void copy()}>Copy details</button>
          {copied && <p role="status">Copied support details.</p>}
          {error && <p role="alert">{error}</p>}
        </Dialog>
      )}
    </div>
  );
}
