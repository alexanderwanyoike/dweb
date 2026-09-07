import type { ConsoleUpdateCheck } from "../update/client";
import type { ConsoleUpdates } from "../update/use-console-updates";
export function updateTitle({ check, busy, installing }: ConsoleUpdates) {
  if (installing) return "Installing update";
  if (busy) return "Checking for updates";
  if (check?.available) return "Update available";
  if (check?.managedByPackage) return "Updates come from your package manager";
  if (check) return "Console is up to date";
  return "Update status unknown";
}
export function updateSummary(updateCheck: ConsoleUpdateCheck | null) {
  if (!updateCheck)
    return "Console checks for signed updates when the app opens.";
  if (updateCheck.available) {
    return "A signed Console update is available. Installing will relaunch Console after the update is applied.";
  }
  if (updateCheck.managedByPackage) {
    return "This Console was installed from a system package. Install the next release's package to update; the built-in updater only serves the AppImage.";
  }
  return "No newer signed Console release is available.";
}
