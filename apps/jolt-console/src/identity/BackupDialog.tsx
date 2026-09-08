import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { useAction } from "../utils/use-action";
import type { LocalIdentity } from "../daemon/types";
import type { IdentityGateway } from "./gateway";
import type { IdentityRecoveryFileClient } from "./recovery-file";
export function BackupDialog({
  identities,
  selected,
  gateway,
  files,
  onClose
}: {
  identities: LocalIdentity[];
  selected: string;
  gateway: IdentityGateway;
  files: IdentityRecoveryFileClient;
  onClose(): void;
}) {
  const [identity, setIdentity] = useState(selected);
  const [label, setLabel] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [message, setMessage] = useState("");
  const action = useAction();
  async function backup() {
    await action.run(async () => {
      const response = await gateway.backup(identity, passphrase, label.trim());
      const path = await files.save(response.identity, response.bundle);
      setPassphrase("");
      setMessage(path ? `Exported ${response.identity} to ${path}.` : "Export cancelled.");
    });
  }
  return (
    <Dialog title="Back up an identity" busy={action.busy} onClose={onClose}>
      <form
        className="task-form"
        onSubmit={(event) => {
          event.preventDefault();
          void backup();
        }}
      >
        <p>Anyone with the export file can become this identity unless you add a passphrase.</p>
        <label>
          Identity
          <select
            value={identity}
            onChange={(event) => setIdentity(event.target.value)}
            disabled={action.busy}
          >
            {identities.map((item) => (
              <option key={item.address} value={item.address}>
                {item.label || "Unnamed identity"} ({item.address})
              </option>
            ))}
          </select>
        </label>
        <label>
          Label
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            disabled={action.busy}
          />
        </label>
        <label>
          Passphrase (optional)
          <input
            type="password"
            autoComplete="new-password"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            disabled={action.busy}
          />
        </label>
        {message && <p role="status">{message}</p>}
        {action.error && <p role="alert">{action.error}</p>}
        <footer>
          <button className="task-primary" disabled={action.busy || !identity}>
            Export identity
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
