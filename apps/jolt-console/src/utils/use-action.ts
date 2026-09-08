import { useCallback, useEffect, useRef, useState } from "react";
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const run = useCallback(async (operation: () => Promise<void>) => {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await operation();
      return true;
    } catch (cause) {
      if (active.current) setError(errorMessage(cause));
      return false;
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }, []);
  return { busy, error, run };
}
