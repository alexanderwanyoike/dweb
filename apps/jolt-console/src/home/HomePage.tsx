import { Link } from "react-router-dom";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import { SnapshotNotice } from "../components/SnapshotNotice";
import { TaskSection, TaskRow } from "../components/TaskSection";
import { formatDuration } from "../utils/format";
export function HomePage({ snapshot }: { snapshot: DaemonSnapshot }) {
  const { status, connected, localIdentities } = snapshot;
  const selected = localIdentities?.identities.find(
    (identity) => identity.address === localIdentities.active_identity,
  );
  const nodeTitle = connected
    ? "Your node is running."
    : "Checking your connection.";
  const uptime =
    status?.uptime_secs == null
      ? "Not reported"
      : formatDuration(status.uptime_secs);
  return (
    <div className="feature-page">
      <SnapshotNotice snapshot={snapshot} />
      <section className="home-health">
        <span className="eyebrow">On this computer</span>
        <h2>{nodeTitle}</h2>
        <p>Jolt connects your apps through a node on this computer.</p>
        <div className="home-health-facts">
          <span>
            Uptime <strong>{uptime}</strong>
          </span>
          <span>
            Peers <strong>{status?.connected_peers ?? "Not reported"}</strong>
          </span>
          <Link to="/settings">Node controls</Link>
        </div>
      </section>
      <TaskSection title="Your identity">
        <TaskRow
          title={selected?.label?.trim() || "Choose an identity"}
          description={
            selected?.address ||
            "Manage the local identities available to your apps."
          }
        >
          <Link to="/identity">Manage identities</Link>
        </TaskRow>
      </TaskSection>
      <TaskSection title="Your apps">
        <TaskRow
          title="Choose what can act with your identity"
          description="Review requests, permissions and existing app access."
        >
          <Link to="/apps">Manage app access</Link>
        </TaskRow>
      </TaskSection>
      <TaskSection title="Network evidence">
        <TaskRow
          title="Bootstrap"
          description={status?.bootstrap_state ?? "Not reported"}
        >
          <Link to="/network">View network</Link>
        </TaskRow>
        <TaskRow
          title="Incoming connections"
          description="No independent remote connection check has been performed."
        >
          <span className="status-label">Not verified</span>
        </TaskRow>
      </TaskSection>
    </div>
  );
}
