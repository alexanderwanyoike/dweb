import { invoke } from "@tauri-apps/api/core";
import type { IdentityExportBundle } from "../daemon/types";
export type IdentityRecoveryFileClient = {
  save(identity: string, bundle: IdentityExportBundle): Promise<string | null>;
  open(): Promise<IdentityExportBundle | null>;
};

export const tauriIdentityRecoveryFileClient: IdentityRecoveryFileClient = {
  save(identity: string, bundle: IdentityExportBundle) {
    return invoke<string | null>("identity_export_save_file", {
      identity,
      bundle
    });
  },
  open() {
    return invoke<IdentityExportBundle | null>("identity_export_open_file");
  }
};
