import { useEffect } from "react";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
export function useConsoleStartup(
  lifecycleClient: DaemonLifecycleClient,
  refresh: () => Promise<boolean>,
) {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const lifecycle = await lifecycleClient.status();
        if (
          cancelled ||
          lifecycle.reachability !== "unavailable" ||
          lifecycle.ownership !== "none"
        ) {
          return;
        }

        await lifecycleClient.start();
        if (!cancelled) {
          await refreshSnapshotUntilConnected(refresh, () => cancelled);
        }
      } catch {
        // Snapshot polling and Settings lifecycle controls surface daemon failures.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lifecycleClient, refresh]);
}
async function refreshSnapshotUntilConnected(
  refresh: () => Promise<boolean>,
  cancelled: () => boolean,
) {
  for (let attempt = 0; attempt < 10 && !cancelled(); attempt += 1) {
    if (await refresh()) return;
    await delay(500);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
