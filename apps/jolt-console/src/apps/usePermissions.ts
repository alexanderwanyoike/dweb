import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { DaemonClient } from "../daemon/client";
import { PermissionsResource } from "./resource";
export function usePermissions(client: DaemonClient, interval: number) {
  const resource = useMemo(
    () => new PermissionsResource(client, interval),
    [client, interval],
  );
  useEffect(() => {
    resource.start();
    return resource.stop;
  }, [resource]);
  const snapshot = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  );
  return { resource, ...snapshot };
}
