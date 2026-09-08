import { useCallback, useEffect, useState } from "react";
import type { DaemonLifecycleClient, DaemonLifecycleState } from "./lifecycle";
import { errorMessage } from "../utils/use-action";

export function useDaemonMonitor(
  client: DaemonLifecycleClient,
  intervalMs = 2000,
) {
  const [state, setState] = useState<DaemonLifecycleState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function read() {
      setBusy(true);
      try {
        const next = await client.status();
        if (!active) return;
        setState(next);
        setError(null);
      } catch (cause) {
        if (active) setError(errorMessage(cause));
      } finally {
        if (active) {
          setBusy(false);
          if (intervalMs > 0) timer = setTimeout(read, intervalMs);
        }
      }
    }
    void read();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [client, intervalMs, revision]);

  return { state, error, busy, refresh };
}
