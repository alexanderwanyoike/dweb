import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { AppAccessGateway } from "./gateway";
import { AppAccessController } from "./app-access-controller";

export function useAppAccess(
  gateway: AppAccessGateway,
  refreshIntervalMs: number,
) {
  const controller = useMemo(
    () => new AppAccessController(gateway, refreshIntervalMs),
    [gateway, refreshIntervalMs],
  );
  useEffect(() => {
    controller.start();
    return controller.stop;
  }, [controller]);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  return {
    state,
    refresh: controller.refresh,
    approve: controller.approve,
    reject: controller.reject,
    revoke: controller.revoke,
  };
}
