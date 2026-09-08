import { useEffect, useState, useCallback } from "react";
import type { NetworkSettingsPayload } from "../daemon/types";
import { useAction, errorMessage } from "../utils/use-action";
import type { RelayGateway } from "./gateway";
export function useRelaySettings(gateway: RelayGateway) {
  const [settings, setSettings] = useState<NetworkSettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const action = useAction();
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    void gateway
      .load()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((error) => {
        if (active) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [gateway]);
  const change = useCallback(
    (operation: () => Promise<NetworkSettingsPayload>) =>
      action.run(async () => {
        const data = await operation();
        setSettings(data);
        setLoadError(null);
      }),
    [action.run],
  );
  return {
    settings,
    busy: loading || action.busy,
    error: loadError || action.error,
    refresh: () => change(gateway.load),
    add: (address: string) => change(() => gateway.add(address)),
    remove: (address: string) => change(() => gateway.remove(address)),
    setHome: (relay: Parameters<RelayGateway["setHome"]>[0]) =>
      change(() => gateway.setHome(relay)),
    clearHome: () => change(gateway.clearHome),
  };
}
export type RelaySettings = ReturnType<typeof useRelaySettings>;
