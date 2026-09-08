import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";

function connectionState(snapshot: Pick<DaemonSnapshot, "connected" | "lastError">) {
  if (snapshot.connected) return { tone: "running", label: "Running" };
  if (snapshot.lastError) return { tone: "unavailable", label: "Unavailable" };
  return { tone: "checking", label: "Checking" };
}

export function NodeStatus({
  snapshot
}: {
  snapshot: Pick<DaemonSnapshot, "connected" | "lastError">;
}) {
  const { tone, label } = connectionState(snapshot);
  return (
    <span className="node-status" data-state={tone} role="status" aria-label="Local node">
      <span className="node-status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
