import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
export function SnapshotNotice({ snapshot }: { snapshot: DaemonSnapshot }) {
  if (snapshot.connected) return null;
  if (!snapshot.lastError) return <p role="status">Checking your node…</p>;
  return (
    <p role="alert" className="access-error">
      Could not refresh your node: {snapshot.lastError}.{" "}
      {snapshot.lastRefresh
        ? "Last known information is shown below."
        : "Information is not available yet."}
    </p>
  );
}
