import {advancedRoutes} from "../advanced";
import { ThemeToggle } from "./ThemeToggle";
import { NavLink, useLocation } from "react-router-dom";
import { consoleRoutes, primaryRoutes } from "../app/navigation";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import type { ConsoleUpdateCheck } from "../update/client";

type ConsoleShellProps = {
  children: React.ReactNode;
  snapshot: DaemonSnapshot;
  consoleVersion: string;
  updateCheck?: ConsoleUpdateCheck | null;
};

export function ConsoleShell({
  children,
  snapshot,
  consoleVersion,
  updateCheck = null,
}: ConsoleShellProps) {
  const location = useLocation();
  const currentRoute =
    consoleRoutes.find((route) => route.path === location.pathname) ??
    consoleRoutes[0];
  const advancedActive = advancedRoutes.some(route=>route.path===location.pathname);
  const daemonVersion = snapshot.status?.daemon_version ?? "unknown";

  return (
    <div className="console-shell">
      <aside className="sidebar" aria-label="Jolt Console sections">
        <div className="brand-lockup">
          <svg viewBox="0 0 64 64" className="brand-mark" aria-hidden="true">
            <rect width="64" height="64" rx="12" fill="#0b0d0c" />
            <path d="M17 43 25 17h8l-8 26zm15 0 8-26h8l-8 26z" fill="#d9ff43" />
          </svg>
          <div>
            <strong>Jolt Console</strong>
            <span>Your local connection</span>
          </div>
        </div>

        <nav className="section-nav">
          {primaryRoutes.map((route) => (
            <NavLink key={route.id} to={route.path} end={route.path === "/"}
              className={({isActive})=>isActive || (route.id==="advanced" && advancedActive) ? "active" : ""}>
              {route.label}
            </NavLink>
          ))}
        </nav>

        <div className="daemon-card">
          <span className="eyebrow">Daemon</span>
          <strong>{snapshot.connected ? "Connected" : "Disconnected"}</strong>
          <span className="mono">{snapshot.daemonUrl}</span>
          <div className="version-list" aria-label="Runtime versions">
            <span>Console v{consoleVersion}</span>
            <span>Daemon v{daemonVersion}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>{currentRoute.label}</h1>
            <p className="page-description">{currentRoute.description}</p>
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
            {updateCheck?.available ? (
              <NavLink className="status-pill pending" to="/settings">
                Update {updateCheck.version}
              </NavLink>
            ) : null}
            <span
              className={`status-pill ${snapshot.connected ? "ok" : "pending"}`}
            >
              {snapshot.connected ? "connected" : "offline"}
            </span>
            {!["apps", "relays", "settings", "advanced"].includes(
              currentRoute.id,
            ) && (
              <button type="button" onClick={() => void snapshot.refresh()}>
                Refresh
              </button>
            )}
          </div>
        </header>

        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}
