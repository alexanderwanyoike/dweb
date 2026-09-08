import { Link } from "react-router-dom";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import { SnapshotNotice } from "../components/SnapshotNotice";
import { TaskSection, TaskRow } from "../components/TaskSection";
import { value } from "../utils/format";
export function NetworkPage({ snapshot }: { snapshot: DaemonSnapshot }) {
  const status = snapshot.status;
  return (
    <div className="feature-page">
      <SnapshotNotice snapshot={snapshot} />
      <TaskSection title="Current checks">
        <TaskRow
          title="Bootstrap connection"
          description="Connection to the configured bootstrap peers."
        >
          <span className="status-label">
            {status?.bootstrap_state ?? "Not reported"}
          </span>
        </TaskRow>
        <TaskRow
          title="Direct peers"
          description="Connections currently reported by this node."
        >
          <strong>{value(status?.direct_peers)}</strong>
        </TaskRow>
        <TaskRow
          title="Relayed peers"
          description="Connections carried through a relay."
        >
          <strong>{value(status?.relayed_peers)}</strong>
        </TaskRow>
        <TaskRow
          title="Incoming connections"
          description="No independent remote connection check has been performed."
        >
          <span className="status-label">Not verified</span>
        </TaskRow>
      </TaskSection>
      <TaskSection title="Connection settings">
        <TaskRow
          title="Bootstrap and home relays"
          description="Review saved configuration and availability options."
        >
          <Link to="/relays">Manage relays</Link>
        </TaskRow>
        <TaskRow
          title="Connected peers"
          description="Inspect addresses and transport details."
        >
          <Link to="/diagnostics">View diagnostics</Link>
        </TaskRow>
      </TaskSection>
      <details className="task-disclosure">
        <summary>Troubleshooting steps</summary>
        <p>
          A working local node and bootstrap connection do not prove an incoming
          connection will succeed from another computer.
        </p>
        <ol>
          <li>
            Check that both computers can connect to their local Jolt node.
          </li>
          <li>Check peer and bootstrap evidence on both computers.</li>
          <li>
            Inspect relay configuration and recent logs before changing network
            settings.
          </li>
        </ol>
      </details>
    </div>
  );
}
