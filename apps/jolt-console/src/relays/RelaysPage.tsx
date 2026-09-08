import { RefreshButton } from "../components/RefreshButton";
import { useMemo } from "react";
import { tauriDaemonClient, type DaemonClient } from "../daemon/client";
import { AdvancedNav } from "../advanced";
import { createRelayGateway } from "./gateway";
import { useRelaySettings } from "./use-relay-settings";
import { BootstrapRelays } from "./BootstrapRelays";
import { HomeRelay } from "./HomeRelay";
export function RelaysPage({ client = tauriDaemonClient }: { client?: DaemonClient }) {
  const gateway = useMemo(() => createRelayGateway(client), [client]);
  const access = useRelaySettings(gateway);
  return (
    <div className="feature-page">
      <AdvancedNav />
      <div className="feature-toolbar">
        <p className="task-help">Configuration saved on this computer.</p>
        <RefreshButton
          disabled={access.busy}
          onClick={() => void access.refresh()}
          label="Refresh relay settings"
        />
      </div>
      {access.error && (
        <p role="alert" className="access-error">
          Network settings error: {access.error}
        </p>
      )}
      {!access.settings && access.busy && <p role="status">Loading relay settings…</p>}
      {access.settings && (
        <>
          <BootstrapRelays access={access} />
          <HomeRelay access={access} />
        </>
      )}
    </div>
  );
}
