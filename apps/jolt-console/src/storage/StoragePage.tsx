import { useState } from "react";
import type { CacheEntry } from "../daemon/types";
import type { DaemonSnapshot } from "../daemon/useDaemonSnapshot";
import { AdvancedNav } from "../advanced";
import { SnapshotNotice } from "../components/SnapshotNotice";
import { ObjectDetails } from "../components/ObjectDetails";
import { TaskSection } from "../components/TaskSection";
import { StorageMetrics } from "./StorageMetrics";
import { formatBytes, shortId } from "../utils/format";
export function StoragePage({ snapshot }: { snapshot: DaemonSnapshot }) {
  const stats = snapshot.cacheStats;
  const [selected, setSelected] = useState<CacheEntry | null>(null);
  return (
    <div className="feature-page">
      <AdvancedNav />
      <SnapshotNotice snapshot={snapshot} />
      <TaskSection title="Storage use">
        <StorageMetrics stats={stats} />
      </TaskSection>
      <TaskSection title="Cached objects">
        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Content ID</th>
                <th>Size</th>
                <th>Pinning</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.cacheEntries.map((entry) => (
                <tr key={entry.content_id}>
                  <td className="mono">{shortId(entry.content_id)}</td>
                  <td>{formatBytes(entry.size)}</td>
                  <td>{entry.pinned ? "Pinned" : "Not pinned"}</td>
                  <td>
                    <button
                      aria-label={`Inspect ${entry.content_id}`}
                      onClick={() => setSelected(entry)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {snapshot.connected && !snapshot.cacheEntries.length && (
          <p className="task-help">No cached entries.</p>
        )}
      </TaskSection>
      {selected && (
        <ObjectDetails
          title="Cached object"
          fields={{
            "Content ID": selected.content_id,
            Size: formatBytes(selected.size),
            Pinned: selected.pinned,
            "Cached at": new Date(selected.cached_at * 1000).toLocaleString(),
            "Last accessed": new Date(selected.last_accessed * 1000).toLocaleString()
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
