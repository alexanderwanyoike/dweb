import type { CacheStats } from "../daemon/types";
import { formatBytes, value } from "../utils/format";
export function StorageMetrics({ stats }: { stats: CacheStats | null }) {
  const metrics = [
    { label: "Cached bytes", value: reportedBytes(stats?.total_cached) },
    { label: "Published bytes", value: reportedBytes(stats?.total_published) },
    { label: "Pinned items", value: value(stats?.pinned_items) },
    { label: "Available", value: reportedBytes(stats?.available) }
  ];
  return (
    <div className="metric-grid">
      {metrics.map((metric) => (
        <div key={metric.label} className="metric-card">
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}
function reportedBytes(bytes: number | undefined) {
  return bytes == null ? "Not reported" : formatBytes(bytes);
}
