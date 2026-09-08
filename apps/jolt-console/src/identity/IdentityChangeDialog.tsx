import { useState } from "react";
import type { LocalIdentity } from "../daemon/types";
import { Dialog } from "../components/Dialog";
import { useAction } from "../utils/use-action";
import type { IdentityGateway } from "./gateway";
export type IdentityChange =
  { kind: "create" } | { kind: "select" | "remove"; identity: LocalIdentity };
export function IdentityChangeDialog({
  change,
  gateway,
  onChanged,
  onClose
}: {
  change: IdentityChange;
  gateway: IdentityGateway;
  onChanged(): Promise<boolean>;
  onClose(): void;
}) {
  const [name, setName] = useState("");
  const action = useAction();
  const titles = {
    create: "Create identity",
    select: "Confirm selection",
    remove: "Remove identity"
  };
  const title = titles[change.kind];
  async function submit() {
    const succeeded = await action.run(async () => {
      if (change.kind === "create") await gateway.create(name.trim());
      if (change.kind === "select") await gateway.select(change.identity.address);
      if (change.kind === "remove") await gateway.remove(change.identity.address);
      await onChanged();
    });
    if (succeeded) onClose();
  }
  return (
    <Dialog title={title} busy={action.busy} onClose={onClose}>
      <form
        className="task-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {change.kind === "create" ? (
          <>
            <p>
              A local label helps you recognise this identity. Apps manage their own public
              profiles.
            </p>
            <label>
              Identity name
              <input
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={action.busy}
              />
            </label>
          </>
        ) : (
          <>
            <h3>{change.identity.label || "Unnamed identity"}</h3>
            <p className="mono">{change.identity.address}</p>
            <p>
              {change.kind === "select"
                ? "New app requests use this selection. Existing app sessions keep their identity."
                : "Remove this identity from this computer. Keep a recovery file before removing access to its key."}
            </p>
          </>
        )}
        {action.error && <p role="alert">{action.error}</p>}
        <footer>
          <button type="button" disabled={action.busy} onClick={onClose}>
            Cancel
          </button>
          <button
            className={change.kind === "remove" ? "access-danger" : "task-primary"}
            disabled={action.busy || (change.kind === "create" && !name.trim())}
          >
            {title}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
