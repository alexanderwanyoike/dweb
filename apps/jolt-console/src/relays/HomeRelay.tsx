import { useState } from "react";
import { TaskSection } from "../components/TaskSection";
import type { RelaySettings } from "./use-relay-settings";
export function HomeRelay({ access }: { access: RelaySettings }) {
  const relay = access.settings?.home_relay;
  const [address, setAddress] = useState(relay?.multiaddr ?? "");
  const [apiUrl, setApiUrl] = useState(relay?.api_url ?? "");
  const [capability, setCapability] = useState(relay?.capability ?? "pinning");
  return (
    <TaskSection title="Home relay">
      {relay ? (
        <dl className="object-details">
          <div>
            <dt>Peer</dt>
            <dd>{relay.peer_id ?? "Not reported"}</dd>
          </div>
          <div>
            <dt>Multiaddr</dt>
            <dd>{relay.multiaddr}</dd>
          </div>
          <div>
            <dt>API URL</dt>
            <dd>{relay.api_url ?? "Not configured"}</dd>
          </div>
          <div>
            <dt>Capability</dt>
            <dd>{relay.capability}</dd>
          </div>
        </dl>
      ) : (
        <p className="task-help">No home relay is configured.</p>
      )}
      <details className="task-disclosure">
        <summary>Configure home relay</summary>
        <p className="task-help">
          A home relay can support content availability. It is separate from bootstrap discovery.
        </p>
        <form
          className="task-form"
          onSubmit={(event) => {
            event.preventDefault();
            void access.setHome({
              multiaddr: address.trim(),
              capability,
              api_url: apiUrl.trim() || null
            });
          }}
        >
          <label>
            Home relay multiaddr
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              disabled={access.busy}
            />
          </label>
          <label>
            Home relay API URL
            <input
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              disabled={access.busy}
            />
          </label>
          <label>
            Home relay capability
            <select
              value={capability}
              onChange={(event) => setCapability(event.target.value)}
              disabled={access.busy}
            >
              <option value="pinning">pinning</option>
              <option value="discovery_only">discovery only</option>
              <option value="unknown">unknown</option>
            </select>
          </label>
          <footer>
            <button
              type="button"
              onClick={() => void access.clearHome()}
              disabled={access.busy || !relay}
            >
              Clear home relay
            </button>
            <button disabled={access.busy || !address.trim()}>Set home relay</button>
          </footer>
        </form>
      </details>
    </TaskSection>
  );
}
