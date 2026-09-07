import { useCallback, useEffect, useState } from "react";
import type { ConsoleUpdateClient, ConsoleUpdateCheck } from "./client";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
import { useAction } from "../utils/use-action";
export function useConsoleUpdates(
  client: ConsoleUpdateClient,
  lifecycle: DaemonLifecycleClient,
) {
  const [check, setCheck] = useState<ConsoleUpdateCheck | null>(null);
  const [installing, setInstalling] = useState(false);
  const action = useAction();
  const refresh = useCallback(
    () =>
      action.run(async () => {
        setCheck(await client.check());
      }),
    [client, action.run],
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const install = () =>
    action.run(async () => {
      if (!check?.available)
        throw new Error("Check for an available update before installing.");
      setInstalling(true);
      try {
        const state = await lifecycle.status();
        if (state.ownership === "console") await lifecycle.stop();
        await client.installAndRelaunch();
      } finally {
        setInstalling(false);
      }
    });
  return {
    check,
    busy: action.busy,
    installing,
    error: action.error,
    refresh,
    install,
  };
}
export type ConsoleUpdates = ReturnType<typeof useConsoleUpdates>;
