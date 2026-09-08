import { useEffect, useRef, useState } from "react";
import type { DaemonLifecycleState } from "../daemon/lifecycle";
import { RefreshButton } from "../components/RefreshButton";

function emptyLogMessage(state: DaemonLifecycleState | null) {
  if (!state) return "Reading daemon output…";
  if (state.ownership === "external") {
    return "This node was started outside Console. Its output stays with the process or service that started it.";
  }
  return "No daemon output has been captured yet.";
}

export function DaemonLog({
  state,
  error,
  busy,
  onRefresh,
}: {
  state: DaemonLifecycleState | null;
  error: string | null;
  busy: boolean;
  onRefresh(): void;
}) {
  const [follow, setFollow] = useState(true);
  const outputRef = useRef<HTMLPreElement>(null);
  const output = state?.log_tail?.join("\n") ?? "";
  useEffect(() => {
    const element = outputRef.current;
    if (follow && element) element.scrollTop = element.scrollHeight;
  }, [follow, output]);

  return (
    <section className="daemon-log">
      <header className="daemon-log-toolbar">
        <h2>Daemon logs</h2>
        <label>
          <input
            type="checkbox"
            checked={follow}
            onChange={(event) => setFollow(event.target.checked)}
          />
          Follow output
        </label>
        <RefreshButton
          label="Refresh daemon logs"
          disabled={busy}
          onClick={onRefresh}
        />
      </header>
      {error && (
        <p role="alert">
          Could not refresh daemon logs: {error}. Showing the last captured
          output.
        </p>
      )}
      <pre
        ref={outputRef}
        className="daemon-log-output"
        role="region"
        aria-label="Daemon log output"
        tabIndex={0}
      >
        {output || emptyLogMessage(state)}
      </pre>
      <div className="daemon-log-caption">
        <span>Latest captured output · refreshes every 2 seconds</span>
        <span>
          {state?.ownership === "console"
            ? "Started by Console"
            : state?.message}
        </span>
      </div>
    </section>
  );
}
