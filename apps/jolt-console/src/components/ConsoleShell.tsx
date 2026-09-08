import { useTheme } from "./use-theme";
import { NodeStatus } from "./NodeStatus";
import { NavigationIcon } from "./NavigationIcon";
import { advancedRoutes } from "../advanced";
import { RefreshButton } from "./RefreshButton";
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
  useTheme();
  const location = useLocation();
  const currentRoute =
    consoleRoutes.find((route) => route.path === location.pathname) ??
    consoleRoutes[0];
  const advancedActive = advancedRoutes.some(
    (route) => route.path === location.pathname,
  );
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
            <strong>Jolt</strong>
            <span>Console</span>
          </div>
        </div>

        <nav className="section-nav">
          {primaryRoutes.map((route) => (
            <NavLink
              key={route.id}
              to={route.path}
              end={route.path === "/"}
              className={({ isActive }) =>
                isActive || (route.id === "advanced" && advancedActive)
                  ? "active"
                  : ""
              }
            >
              <NavigationIcon name={route.id} />
              {route.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>{advancedActive ? "Advanced" : currentRoute.label}</h1>
          </div>
          <div className="topbar-actions">
            {updateCheck?.available ? (
              <NavLink className="status-pill pending" to="/settings">
                Update {updateCheck.version}
              </NavLink>
            ) : null}
            {![
              "apps",
              "relays",
              "settings",
              "advanced",
              "diagnostics",
            ].includes(currentRoute.id) && (
              <RefreshButton onClick={() => void snapshot.refresh()} />
            )}
          </div>
        </header>

        <div className="workspace-content">{children}</div>
      </main>
      <footer className="console-statusbar">
        <span className="console-node-summary">
          Local node <NodeStatus snapshot={snapshot} />
        </span>
        <span className="console-endpoint mono">{snapshot.daemonUrl}</span>
        <span className="version-list" aria-label="Runtime versions">
          <span>Console v{consoleVersion}</span>
          <span>Node v{daemonVersion}</span>
        </span>
      </footer>
    </div>
  );
}
