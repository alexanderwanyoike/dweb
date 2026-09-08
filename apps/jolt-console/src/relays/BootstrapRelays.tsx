import { useState } from "react";
import { TaskSection } from "../components/TaskSection";
import type { RelaySettings } from "./use-relay-settings";
export function BootstrapRelays({ access }: { access: RelaySettings }) {
  const [address, setAddress] = useState("");
  const { settings, busy } = access;
  return (
    <TaskSection title="Configured bootstrap relays">
      <ul className="relay-list">
        {settings?.configured_bootstrap_relays.map((relay) => (
          <li key={relay}>
            <code>{relay}</code>
            <button disabled={busy} onClick={() => void access.remove(relay)}>
              Remove bootstrap relay
            </button>
          </li>
        ))}
      </ul>
      {settings?.configured_bootstrap_relays.length === 0 && (
        <p className="task-help">No configured bootstrap relays.</p>
      )}
      <details className="task-disclosure">
        <summary>Add a bootstrap relay</summary>
        <form
          className="task-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await access.add(address.trim())) setAddress("");
          }}
        >
          <label>
            Bootstrap relay multiaddr
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              disabled={busy}
            />
          </label>
          <footer>
            <button disabled={busy || !address.trim()}>Add bootstrap relay</button>
          </footer>
        </form>
      </details>
      <details className="task-disclosure">
        <summary>Built-in defaults</summary>
        <ul className="relay-list">
          {settings?.built_in_bootstrap_relays.map((relay) => (
            <li key={relay}>
              <code>{relay}</code>
            </li>
          ))}
        </ul>
        <h3>Effective at startup</h3>
        <ul className="relay-list">
          {settings?.effective_bootstrap_relays.map((relay) => (
            <li key={relay}>
              <code>{relay}</code>
            </li>
          ))}
        </ul>
        <p className="task-help">
          Custom bootstrap relays take precedence over built-in defaults. Saved configuration and
          runtime connection evidence are separate.
        </p>
      </details>
    </TaskSection>
  );
}
