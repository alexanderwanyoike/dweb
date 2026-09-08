import { useConsoleStartup } from "./use-console-startup";
import { useConsoleUpdates } from "../update/use-console-updates";
import { AdvancedPage } from "../advanced";
import { useMemo } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ConsoleShell } from "../components/ConsoleShell";
import { tauriDaemonClient, type DaemonClient } from "../daemon/client";
import {
  tauriDaemonLifecycleClient,
  type DaemonLifecycleClient,
} from "../daemon/lifecycle";
import { useDaemonSnapshot } from "../daemon/useDaemonSnapshot";
import { AppsPage, createAppAccessGateway } from "../apps";
import { StoragePage } from "../storage";
import { DiagnosticsPage } from "../diagnostics";
import { IdentityPage } from "../identity";
import { NetworkPage } from "../network";
import { HomePage } from "../home";
import { PublishedPage } from "../published";
import { RelaysPage } from "../relays";
import { SettingsPage } from "../settings";
import {
  tauriConsoleUpdateClient,
  type ConsoleUpdateClient,
} from "../update/client";
import { CONSOLE_VERSION } from "../version";

type ConsoleAppProps = {
  client?: DaemonClient;
  lifecycleClient?: DaemonLifecycleClient;
  updateClient?: ConsoleUpdateClient;
  consoleVersion?: string;
  refreshIntervalMs?: number;
};

export function ConsoleApp({
  client = tauriDaemonClient,
  lifecycleClient = tauriDaemonLifecycleClient,
  updateClient = tauriConsoleUpdateClient,
  consoleVersion = CONSOLE_VERSION,
  refreshIntervalMs = 5000,
}: ConsoleAppProps) {
  const snapshot = useDaemonSnapshot(client, refreshIntervalMs);
  const appAccess = useMemo(() => createAppAccessGateway(client), [client]);
  useConsoleStartup(lifecycleClient, snapshot.refresh);
  const updates = useConsoleUpdates(updateClient, lifecycleClient);

  return (
    <HashRouter>
      <ConsoleShell
        snapshot={snapshot}
        consoleVersion={consoleVersion}
        updateCheck={updates.check}
      >
        <Routes>
          <Route index element={<HomePage snapshot={snapshot} />} />
          <Route
            path="/identity"
            element={<IdentityPage client={client} snapshot={snapshot} />}
          />
          <Route
            path="/apps"
            element={
              <AppsPage
                gateway={appAccess}
                refreshIntervalMs={refreshIntervalMs}
              />
            }
          />
          <Route
            path="/network"
            element={<NetworkPage snapshot={snapshot} />}
          />
          <Route path="/relays" element={<RelaysPage client={client} />} />
          <Route
            path="/published"
            element={<PublishedPage snapshot={snapshot} />}
          />
          <Route path="/cache" element={<StoragePage snapshot={snapshot} />} />
          <Route
            path="/settings"
            element={
              <SettingsPage
                lifecycleClient={lifecycleClient}
                updates={updates}
                onNodeChanged={snapshot.refresh}
              />
            }
          />
          <Route
            path="/diagnostics"
            element={
              <DiagnosticsPage
                snapshot={snapshot}
                lifecycleClient={lifecycleClient}
              />
            }
          />
          <Route
            path="/advanced"
            element={<AdvancedPage lifecycleClient={lifecycleClient} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ConsoleShell>
    </HashRouter>
  );
}
