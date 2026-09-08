import { Link } from "react-router-dom";
import {
  tauriDaemonLifecycleClient,
  type DaemonLifecycleClient,
} from "../daemon/lifecycle";
import { useDaemonMonitor } from "../daemon/use-daemon-monitor";
import { DaemonLog } from "../diagnostics/DaemonLog";
import "../diagnostics/diagnostics.css";
import { AdvancedNav } from "./AdvancedNav";

export function AdvancedPage({
  lifecycleClient = tauriDaemonLifecycleClient,
}: {
  lifecycleClient?: DaemonLifecycleClient;
}) {
  const monitor = useDaemonMonitor(lifecycleClient);
  return (
    <div className="advanced-log-page">
      <AdvancedNav />
      <DaemonLog
        state={monitor.state}
        error={monitor.error}
        busy={monitor.busy}
        onRefresh={monitor.refresh}
      />
      <div className="advanced-process-footer">
        <span>Process {monitor.state?.pid ?? "not reported"}</span>
        <Link to="/settings">Node controls</Link>
      </div>
    </div>
  );
}
