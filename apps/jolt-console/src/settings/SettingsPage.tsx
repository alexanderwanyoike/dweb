import { Link } from "react-router-dom";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
import type { ConsoleUpdates } from "../update/use-console-updates";
import { TaskSection, TaskRow } from "../components/TaskSection";
import { AppearanceSettings } from "./AppearanceSettings";
import { NodeSettings } from "./NodeSettings";
import { UpdateSettings } from "./UpdateSettings";
export function SettingsPage({
  lifecycleClient,
  updates,
  onNodeChanged,
}: {
  lifecycleClient: DaemonLifecycleClient;
  updates: ConsoleUpdates;
  onNodeChanged?: () => Promise<boolean>;
}) {
  return (
    <div className="feature-page">
      <AppearanceSettings />
      <NodeSettings client={lifecycleClient} onChanged={onNodeChanged} />
      <UpdateSettings updates={updates} />
      <TaskSection title="More controls">
        <TaskRow
          title="Network settings"
          description="Bootstrap configuration and home relay."
        >
          <Link to="/relays">Manage relays</Link>
        </TaskRow>
        <TaskRow
          title="Diagnostic details"
          description="Logs, connection evidence and local process information."
        >
          <Link to="/diagnostics">Open diagnostics</Link>
        </TaskRow>
      </TaskSection>
    </div>
  );
}
