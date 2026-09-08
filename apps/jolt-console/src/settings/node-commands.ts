import type { DaemonLifecycleClient } from "../daemon/lifecycle";
export type NodeCommand = "start" | "stop" | "restart";
export async function runNodeCommand(
  client: DaemonLifecycleClient,
  command: NodeCommand,
) {
  const current = await client.status();
  if (command === "start") {
    if (current.ownership !== "none" || current.reachability !== "unavailable")
      throw new Error(
        "The node state has changed. Refresh its status before starting it.",
      );
  } else if (current.ownership !== "console") {
    throw new Error(
      "Console no longer owns this node. Its owner must stop or restart it.",
    );
  }
  return client[command]();
}
