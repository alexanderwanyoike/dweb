import { useEffect, useState } from "react";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import {
  tauriDaemonLifecycleClient,
  type DaemonLifecycleClient,
  type DaemonLifecycleState,
} from "../daemon/lifecycle";
import { AdvancedNav } from "../advanced";
import { TaskSection, TaskRow } from "../components/TaskSection";
import { SnapshotNotice } from "../components/SnapshotNotice";
import { Dialog } from "../components/Dialog";
import { errorMessage } from "../utils/use-action";
import { CONSOLE_VERSION } from "../version";
export function DiagnosticsPage({
  snapshot,
  lifecycleClient = tauriDaemonLifecycleClient,
}: {
  snapshot: DaemonSnapshot;
  lifecycleClient?: DaemonLifecycleClient;
}) {
  const [lifecycle, setLifecycle] = useState<DaemonLifecycleState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    void lifecycleClient
      .status()
      .then((state) => {
        if (active) setLifecycle(state);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [lifecycleClient]);
  const details = JSON.stringify(
    {
      console_version: CONSOLE_VERSION,
      daemon_url: snapshot.daemonUrl,
      last_checked: snapshot.lastRefresh,
      status: snapshot.status,
      peers: snapshot.peers,
      error: snapshot.lastError,
      lifecycle,
    },
    null,
    2,
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(details);
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
      <TaskSection title="Recent log">
        {lifecycle?.log_tail?.length ? (
          <pre className="diagnostics-output">
            {lifecycle.log_tail.join("\n")}
          </pre>
        ) : (
          <p className="task-help">
            No log lines are available from Console. An externally managed node
            keeps its own logs.
          </p>
        )}
      </TaskSection>
      <details className="task-disclosure">
        <summary>Raw connection state</summary>
        <pre className="diagnostics-output">{details}</pre>
      </details>
      <div>
        <button
          onClick={() => {
            setCopied(false);
            setReview(true);
          }}
        >
          Prepare support details
        </button>
      </div>
      {review && (
        <Dialog title="Review support details" onClose={() => setReview(false)}>
          <p>
            This excerpt includes node identifiers, addresses and available
            logs. Review it before copying. Nothing is sent automatically.
          </p>
          <pre className="diagnostics-output">{details}</pre>
          <button onClick={() => void copy()}>Copy details</button>
          {copied && <p role="status">Copied support details.</p>}
          {error && <p role="alert">{error}</p>}
        </Dialog>
      )}
    </div>
  );
}
