import { useMemo, useState } from "react";
import type { DaemonClient } from "../daemon/client";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import { tauriDaemonLifecycleClient, type DaemonLifecycleClient } from "../daemon/lifecycle";
import { TaskSection, TaskRow } from "../components/TaskSection";
import { SnapshotNotice } from "../components/SnapshotNotice";
import { createIdentityGateway } from "./gateway";
import { tauriIdentityRecoveryFileClient, type IdentityRecoveryFileClient } from "./recovery-file";
import { IdentityChangeDialog, type IdentityChange } from "./IdentityChangeDialog";
import { BackupDialog } from "./BackupDialog";
import { RestoreDialog } from "./RestoreDialog";
export function IdentityPage({
  client,
  snapshot,
  recoveryFileClient = tauriIdentityRecoveryFileClient,
  lifecycleClient = tauriDaemonLifecycleClient
}: {
  client: DaemonClient;
  snapshot: DaemonSnapshot;
  recoveryFileClient?: IdentityRecoveryFileClient;
  lifecycleClient?: DaemonLifecycleClient;
}) {
  const gateway = useMemo(() => createIdentityGateway(client), [client]);
  const [change, setChange] = useState<IdentityChange | null>(null);
  const [recovery, setRecovery] = useState<"backup" | "restore" | null>(null);
  const identities = snapshot.localIdentities?.identities ?? [];
  const selected =
    snapshot.localIdentities?.active_identity ?? snapshot.status?.identity_address ?? "";
  return (
    <div className="feature-page">
      <SnapshotNotice snapshot={snapshot} />
      <TaskSection
        title="Local identities"
        action={
          <button disabled={!snapshot.connected} onClick={() => setChange({ kind: "create" })}>
            Add identity
          </button>
        }
      >
        <p className="task-help">
          Choose the identity for new app requests. These labels stay on this computer.
        </p>
        {identities.map((identity) => (
          <TaskRow
            key={identity.address}
            title={identity.label?.trim() || "Unnamed identity"}
            description={<span className="mono">{identity.address}</span>}
          >
            {identity.address === selected ? (
              <span className="status-label">Selected</span>
            ) : (
              <button
                disabled={!snapshot.connected}
                aria-label={`Use ${identity.label || "Unnamed identity"}`}
                onClick={() => setChange({ kind: "select", identity })}
              >
                Use identity
              </button>
            )}
            <button
              disabled={
                !snapshot.connected || identity.address === snapshot.status?.identity_address
              }
              aria-label={`Remove ${identity.label || "Unnamed identity"}`}
              onClick={() => setChange({ kind: "remove", identity })}
            >
              Remove
            </button>
          </TaskRow>
        ))}
        {snapshot.connected && identities.length === 0 && (
          <p className="task-help">No local identities are available.</p>
        )}
      </TaskSection>
      <TaskSection title="Recovery">
        <div className="task-columns">
          <TaskRow
            title="Back up an identity"
            description="Keep a recovery file somewhere you can find it again."
          >
            <button
              disabled={!snapshot.connected || !identities.length}
              onClick={() => setRecovery("backup")}
            >
              Back up an identity
            </button>
          </TaskRow>
          <TaskRow
            title="Restore from a file"
            description="Add an existing identity to this computer."
          >
            <button disabled={!snapshot.connected} onClick={() => setRecovery("restore")}>
              Restore from a file
            </button>
          </TaskRow>
        </div>
      </TaskSection>
      <details className="task-disclosure">
        <summary>Node identity details</summary>
        <p>Daemon signing identity</p>
        <p className="mono">{snapshot.status?.identity_address ?? "Not reported"}</p>
        <p>Peer ID</p>
        <p className="mono">{snapshot.status?.peer_id ?? "Not reported"}</p>
      </details>
      {change && (
        <IdentityChangeDialog
          change={change}
          gateway={gateway}
          onChanged={snapshot.refresh}
          onClose={() => setChange(null)}
        />
      )}
      {recovery === "backup" && (
        <BackupDialog
          identities={identities}
          selected={selected}
          gateway={gateway}
          files={recoveryFileClient}
          onClose={() => setRecovery(null)}
        />
      )}
      {recovery === "restore" && (
        <RestoreDialog
          gateway={gateway}
          files={recoveryFileClient}
          lifecycle={lifecycleClient}
          onChanged={snapshot.refresh}
          onClose={() => setRecovery(null)}
        />
      )}
    </div>
  );
}
