import { useState } from "react";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
import { Dialog } from "../components/Dialog";
import { TaskSection, TaskRow } from "../components/TaskSection";
import { useNodeControls } from "./use-node-controls";
export function NodeSettings({
  client,
  onChanged,
}: {
  client: DaemonLifecycleClient;
  onChanged?: () => Promise<boolean>;
}) {
  const controls = useNodeControls(client, onChanged);
  const [pending, setPending] = useState<"stop" | "restart" | null>(null);
  const { state, busy, error } = controls;
  const canStart =
    state?.reachability === "unavailable" && state.ownership === "none";
  const canControl = state?.ownership === "console";
  async function confirm() {
    if (pending && (await controls.run(pending))) setPending(null);
  }
  return (
    <TaskSection
      title="Your node"
      action={
        <button disabled={busy} onClick={() => void controls.refresh()}>
          Refresh lifecycle
        </button>
      }
    >
      <TaskRow
        title={state?.message ?? "Checking your node…"}
        description={
          state
            ? `Ownership: ${state.ownership} · PID: ${state.pid ?? "Not reported"}`
            : "Reading local process state."
        }
      >
        <span className="status-label">
          {state?.reachability ?? "Checking"}
        </span>
      </TaskRow>
      {state?.ownership === "external" && (
        <p className="task-help">
          Console will not stop or restart it because another process owns this
          daemon.
        </p>
      )}
      {state?.ownership === "console" && (
        <p className="task-help">
          Closing the window keeps this node running. Quit from the tray stops
          it.
        </p>
      )}
      {state?.last_error && <p role="alert">{state.last_error}</p>}
      {error && !pending && <p role="alert">{error}</p>}
      <div className="node-actions">
        <button
          disabled={busy || !canStart}
          onClick={() => void controls.run("start")}
        >
          Start node
        </button>
        <button
          disabled={busy || !canControl}
          onClick={() => setPending("restart")}
        >
          Restart node
        </button>
        <button
          disabled={busy || !canControl}
          onClick={() => setPending("stop")}
        >
          Stop node
        </button>
      </div>
      {pending && (
        <Dialog
          title={pending === "stop" ? "Stop your node?" : "Restart your node?"}
          busy={busy}
          onClose={() => setPending(null)}
        >
          <p>
            Connected apps will lose their local connection while this node is
            stopped. Console checks ownership again before proceeding.
          </p>
          {error && <p role="alert">{error}</p>}
          <div className="node-actions">
            <button disabled={busy} onClick={() => setPending(null)}>
              Cancel
            </button>
            <button
              className="access-danger"
              disabled={busy}
              onClick={() => void confirm()}
            >
              Confirm {pending}
            </button>
          </div>
        </Dialog>
      )}
    </TaskSection>
  );
}
