import { Link } from "react-router-dom";
import { tauriDaemonClient, type DaemonClient } from "../daemon/client";
import { useEffect, useState } from "react";
import { SectionPanel } from "../components/primitives";
import {
  tauriDaemonLifecycleClient,
  type DaemonLifecycleClient,
  type DaemonLifecycleState,
} from "../daemon/lifecycle";
import {
  tauriConsoleUpdateClient,
  type ConsoleUpdateCheck,
  type ConsoleUpdateClient,
} from "../update/client";

type SettingsPageProps = {
  lifecycleClient?: DaemonLifecycleClient;
  daemonClient?: DaemonClient;
  updateClient?: ConsoleUpdateClient;
};

export function SettingsPage({
  lifecycleClient = tauriDaemonLifecycleClient,
  daemonClient = tauriDaemonClient,
  updateClient = tauriConsoleUpdateClient,
}: SettingsPageProps) {
  const [state, setState] = useState<DaemonLifecycleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateCheck, setUpdateCheck] = useState<ConsoleUpdateCheck | null>(
    null,
  );
  const [updateAction, setUpdateAction] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  async function refreshLifecycle() {
    setError(null);
    setLoading(true);
    try {
      setState(await lifecycleClient.status());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function runAction(
    label: string,
    operation: () => Promise<DaemonLifecycleState>,
  ) {
    setAction(label);
    setError(null);
    try {
      const nextState = await operation();
      setState(nextState);
      if (label === "start" || label === "restart") {
        try {
          setState(await lifecycleClient.status());
        } catch {
          // The lifecycle action already succeeded; keep the last known state.
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAction(null);
    }
  }

  async function checkForConsoleUpdate() {
    setUpdateAction("check");
    setUpdateError(null);
    try {
      setUpdateCheck(await updateClient.check());
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdateAction(null);
    }
  }

  async function installConsoleUpdate() {
    setUpdateAction("install");
    setUpdateError(null);
    try {
      const lifecycle = await lifecycleClient.status();
      if (lifecycle.ownership === "console") {
        await lifecycleClient.stop();
      }

      await updateClient.installAndRelaunch();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdateAction(null);
    }
  }

  useEffect(() => {
    void refreshLifecycle();
  }, [lifecycleClient]);

  useEffect(() => {
    void checkForConsoleUpdate();
  }, [updateClient]);

  const canStart = state?.reachability === "unavailable";
  const canControl = state?.ownership === "console";
  const busy = loading || action !== null;

  return (
    <SectionPanel
      eyebrow="Settings"
      summary="daemon lifecycle and local configuration"
      hero
    >
      <div className="settings-stack">
        <div className="lifecycle-panel">
          <div className="lifecycle-header">
            <div>
              <span className="eyebrow">Daemon lifecycle</span>
              <h2>{state ? lifecycleTitle(state) : "Checking daemon"}</h2>
            </div>
            <span
              className={`status-pill ${state?.reachability === "healthy" ? "ok" : "pending"}`}
            >
              {state?.reachability ?? "checking"}
            </span>
          </div>

          {state ? (
            <div className="lifecycle-details">
              <div className="detail-row">
                <span>Daemon URL</span>
                <strong className="mono">{state.daemon_url}</strong>
              </div>
              <div className="detail-row">
                <span>Ownership</span>
                <strong className="mono">
                  {ownershipLabel(state.ownership)}
                </strong>
              </div>
              <div className="detail-row">
                <span>PID</span>
                <strong className="mono">{state.pid ?? "--"}</strong>
              </div>
            </div>
          ) : null}

          {state ? <p className="lifecycle-message">{state.message}</p> : null}
          {state?.ownership === "external" ? (
            <p className="lifecycle-warning">
              Console will not stop or restart it because another process owns
              this daemon.
            </p>
          ) : null}
          {state?.last_error ? (
            <div className="permission-error">
              Daemon lifecycle error: {state.last_error}
            </div>
          ) : null}
          {error ? (
            <div className="permission-error">
              Daemon lifecycle error: {error}
            </div>
          ) : null}

          <div className="lifecycle-actions">
            <button
              type="button"
              onClick={() => void refreshLifecycle()}
              disabled={busy}
            >
              Refresh lifecycle
            </button>
            <button
              type="button"
              onClick={() => void runAction("start", lifecycleClient.start)}
              disabled={busy || !canStart}
            >
              Start daemon
            </button>
            <button
              type="button"
              onClick={() => void runAction("restart", lifecycleClient.restart)}
              disabled={busy || !canControl}
            >
              Restart daemon
            </button>
            <button
              type="button"
              onClick={() => void runAction("stop", lifecycleClient.stop)}
              disabled={busy || !canControl}
            >
              Stop daemon
            </button>
          </div>

          {state?.log_tail?.length ? (
            <pre className="lifecycle-log">{state.log_tail.join("\n")}</pre>
          ) : null}
        </div>

        <div className="lifecycle-panel">
          <div className="lifecycle-header">
            <div>
              <span className="eyebrow">Console updates</span>
              <h2>{updateTitle(updateCheck, updateAction)}</h2>
            </div>
            <span
              className={`status-pill ${updateCheck?.available ? "pending" : "ok"}`}
            >
              {updateAction ??
                (updateCheck?.available ? "available" : "stable")}
            </span>
          </div>

          <p className="settings-help">{updateSummary(updateCheck)}</p>
          {updateCheck?.available ? (
            <div className="lifecycle-details">
              <div className="detail-row">
                <span>Version</span>
                <strong className="mono">
                  {updateCheck.currentVersion} -&gt; {updateCheck.version}
                </strong>
              </div>
              {updateCheck.date ? (
                <div className="detail-row">
                  <span>Published</span>
                  <strong className="mono">{updateCheck.date}</strong>
                </div>
              ) : null}
            </div>
          ) : null}
          {updateCheck?.available && updateCheck.notes ? (
            <p className="lifecycle-message">{updateCheck.notes}</p>
          ) : null}
          {updateError ? (
            <div className="permission-error">
              Console update error: {updateError}
            </div>
          ) : null}

          <div className="lifecycle-actions">
            <button
              type="button"
              onClick={() => void checkForConsoleUpdate()}
              disabled={updateAction !== null}
            >
              Check for updates
            </button>
            <button
              type="button"
              onClick={() => void installConsoleUpdate()}
              disabled={
                updateAction !== null || updateCheck?.available !== true
              }
            >
              Install and restart
            </button>
          </div>
        </div>

        <Link to="/relays">Manage bootstrap and home relays</Link>
      </div>
    </SectionPanel>
  );
}

function lifecycleTitle(state: DaemonLifecycleState) {
  if (state.ownership === "console") return "Console-owned daemon";
  if (state.ownership === "external") return "Externally-owned daemon";
  if (state.reachability === "unhealthy") return "Daemon unhealthy";
  return "Daemon unavailable";
}

function ownershipLabel(ownership: DaemonLifecycleState["ownership"]) {
  if (ownership === "console") return "Console-owned";
  if (ownership === "external") return "External";
  return "None";
}

function updateTitle(
  updateCheck: ConsoleUpdateCheck | null,
  action: string | null,
) {
  if (action === "check") return "Checking for updates";
  if (action === "install") return "Installing update";
  if (updateCheck?.available) return "Update available";
  if (updateCheck?.managedByPackage)
    return "Updates come from your package manager";
  if (updateCheck) return "Console is up to date";
  return "Update status unknown";
}

function updateSummary(updateCheck: ConsoleUpdateCheck | null) {
  if (!updateCheck)
    return "Console checks for signed updates when Settings opens.";
  if (updateCheck.available) {
    return "A signed Console update is available. Installing will relaunch Console after the update is applied.";
  }
  if (updateCheck.managedByPackage) {
    return "This Console was installed from a system package. Install the next release's package to update; the built-in updater only serves the AppImage.";
  }
  return "No newer signed Console release is available.";
}
