import { useState } from "react";
import type { PublishedContent } from "../daemon/types";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import { AdvancedNav } from "../advanced";
import { SnapshotNotice } from "../components/SnapshotNotice";
import { ObjectDetails } from "../components/ObjectDetails";
import { TaskSection } from "../components/TaskSection";
import { formatBytes } from "../utils/format";
export function PublishedPage({ snapshot }: { snapshot: DaemonSnapshot }) {
  const [selected, setSelected] = useState<PublishedContent | null>(null);
  const [search, setSearch] = useState("");
  const items = snapshot.published.filter((item) =>
    `${item.path} ${item.content_id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="feature-page">
      <AdvancedNav />
      <SnapshotNotice snapshot={snapshot} />
      <TaskSection title="Published inventory">
        <p className="task-help mono">
          {snapshot.localIdentities?.active_identity ??
            "Selected identity not reported"}
        </p>
        <label className="inventory-search">
          Find published content
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Path</th>
                <th>Size</th>
                <th>Availability</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.address}:${item.content_id}`}>
                  <td className="mono">{item.path ?? "Unaddressed"}</td>
                  <td>{formatBytes(item.size)}</td>
                  <td>{item.pin_state ?? "Not reported"}</td>
                  <td>
                    <button
                      aria-label={`Inspect ${item.path ?? item.content_id}`}
                      onClick={() => setSelected(item)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {snapshot.connected && !items.length && (
          <p className="task-help">No published content matches this view.</p>
        )}
      </TaskSection>
      <p className="task-help">
        Paths identify content. Console shows its metadata; apps own its meaning
        and editing.
      </p>
      {selected && (
        <ObjectDetails
          title="Published object"
          fields={{
            "Content ID": selected.content_id,
            Address: selected.address,
            Path: selected.path,
            Size: formatBytes(selected.size),
            Availability: selected.pin_state,
            "Relay peer": selected.relay?.peer_id,
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
