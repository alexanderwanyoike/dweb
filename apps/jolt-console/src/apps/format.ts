export function sessionTimeLabel(seconds?: number | null) {
  if (!seconds) return "Never used";
  return new Date(seconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
