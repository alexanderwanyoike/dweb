import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { useAction, errorMessage } from "../utils/use-action";
import type { IdentityExportBundle } from "../daemon/types";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
import type { IdentityGateway } from "./gateway";
import type { IdentityRecoveryFileClient } from "./recovery-file";
export function RestoreDialog({
  gateway,
  files,
  lifecycle,
  onChanged,
  onClose
}: {
  gateway: IdentityGateway;
  files: IdentityRecoveryFileClient;
  lifecycle: DaemonLifecycleClient;
  onChanged(): Promise<boolean>;
  onClose(): void;
}) {
  const [pending, setPending] = useState<IdentityExportBundle | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [message, setMessage] = useState("");
  const action = useAction();
  async function restore() {
    await action.run(async () => {
      const bundle = pending ?? (await files.open());
      if (!bundle) {
        setMessage("Import cancelled.");
        return;
      }
      try {
        const response = await gateway.restore(bundle, passphrase);
        if (response.restart_required) await lifecycle.restart();
        setMessage(
          response.restart_required
            ? `Imported ${response.identity} and restarted the daemon.`
            : `Imported ${response.identity} as a local identity.`
        );
        setPending(null);
        setPassphrase("");
        await onChanged();
      } catch (error) {
        const text = errorMessage(error);
        if (
          !text.includes("identity_recovery_invalid") ||
          !text.includes("identity export passphrase is incorrect")
        )
          throw error;
        setPending(bundle);
        setMessage("This identity export needs a passphrase.");
        if (pending) throw new Error("That passphrase did not unlock the identity export.");
      }
    });
  }
  return (
    <Dialog title="Restore from a file" busy={action.busy} onClose={onClose}>
      <form
        className="task-form"
        onSubmit={(event) => {
          event.preventDefault();
          void restore();
        }}
      >
        <p>
          Import validates the bundle and adds it as a local identity without replacing the daemon
          identity.
        </p>
        {pending && (
          <label>
            Passphrase
            <input
              autoFocus
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              disabled={action.busy}
            />
          </label>
        )}
        {message && <p role="status">{message}</p>}
        {action.error && <p role="alert">{action.error}</p>}
        <footer>
          <button className="task-primary" disabled={action.busy}>
            {pending ? "Unlock and import" : "Import identity"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
