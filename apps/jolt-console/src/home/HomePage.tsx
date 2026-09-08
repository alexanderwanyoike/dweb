import { Link } from "react-router-dom";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import { NodeStatus } from "../components/NodeStatus";
import { SnapshotNotice } from "../components/SnapshotNotice";
import { TaskSection, TaskRow } from "../components/TaskSection";
import { formatDuration } from "../utils/format";

export function HomePage({ snapshot }: { snapshot: DaemonSnapshot }) {
  const { status, localIdentities } = snapshot;
  const selected = localIdentities?.identities.find(
    (identity) => identity.address === localIdentities.active_identity
  );
  const uptime = status?.uptime_secs == null ? "Not reported" : formatDuration(status.uptime_secs);

  return (
    <div className="feature-page home-page">
      <SnapshotNotice snapshot={snapshot} />
      <TaskSection title="Local node" action={<Link to="/settings">Node controls</Link>}>
        <div className="home-node-line">
          <NodeStatus snapshot={snapshot} />
          <dl className="home-node-facts">
            <div>
              <dt>Uptime</dt>
              <dd>{uptime}</dd>
            </div>
            <div>
              <dt>Peers</dt>
              <dd>{status?.connected_peers ?? "Not reported"}</dd>
            </div>
          </dl>
        </div>
        <TaskRow title="Bootstrap" description="Connection to the configured bootstrap peers.">
          <span className="home-value">{status?.bootstrap_state ?? "Not reported"}</span>
        </TaskRow>
        <TaskRow
          title="Incoming connections"
          description="No independent remote connection check has been performed."
        >
          <span className="home-value">Not verified</span>
        </TaskRow>
      </TaskSection>
      <TaskSection title="On this computer">
        <TaskRow
          title={selected?.label?.trim() || "Choose an identity"}
          description={selected?.address || "No local identity selected."}
        >
          <Link to="/identity">Manage identities</Link>
        </TaskRow>
        <TaskRow title="App access" description="Connected apps, permissions and pending requests.">
          <Link to="/apps">Manage app access</Link>
        </TaskRow>
        <TaskRow title="Network" description="Peer connections and relay configuration.">
          <Link to="/network">View network</Link>
        </TaskRow>
      </TaskSection>
    </div>
  );
}
