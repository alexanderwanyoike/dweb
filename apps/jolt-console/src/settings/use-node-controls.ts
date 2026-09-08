import { useCallback, useEffect, useState } from "react";
import type { DaemonLifecycleClient, DaemonLifecycleState } from "../daemon/lifecycle";
import { useAction } from "../utils/use-action";
import { runNodeCommand, type NodeCommand } from "./node-commands";
export function useNodeControls(client: DaemonLifecycleClient, onChanged?: () => Promise<boolean>) {
  const [state, setState] = useState<DaemonLifecycleState | null>(null);
  const action = useAction();
  const refresh = useCallback(
    () =>
      action.run(async () => {
        setState(await client.status());
      }),
    [client, action.run]
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const run = (command: NodeCommand) =>
    action.run(async () => {
      setState(await runNodeCommand(client, command));
      if (onChanged) await onChanged();
    });
  return { state, busy: action.busy, error: action.error, refresh, run };
}
