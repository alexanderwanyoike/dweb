import { expect, it, vi } from "vitest";
import { AppAccessController } from "./app-access-controller";
import { createAppAccessGateway } from "./gateway";
import { grant } from "./fixtures.test-support";
import type { DaemonClient } from "../daemon/client";

function client() {
  return {
    daemonUrl: "",
    get: vi.fn(async (path: string) => {
      if (path.endsWith("/sessions")) return [grant("one")];
      if (path.endsWith("identities"))
        return { identities: [], active_identity: null };
      return [];
    }),
    post: vi.fn(async () => ({})),
  } as unknown as DaemonClient;
}

it("coalesces refreshes and retains the last known permissions on failure", async () => {
  const api = client();
  const controller = new AppAccessController(createAppAccessGateway(api), 0);
  await Promise.all([controller.refresh(), controller.refresh()]);
  expect(api.get).toHaveBeenCalledTimes(3);
  vi.mocked(api.get).mockRejectedValue(new Error("Offline"));
  await controller.refresh();
  expect(controller.getSnapshot().data.sessions).toHaveLength(1);
  expect(controller.getSnapshot().error).toBe("Offline");
});

it("ignores old responses after the controller stops", async () => {
  const api = client();
  const controller = new AppAccessController(createAppAccessGateway(api), 0);
  const pending = controller.refresh();
  controller.stop();
  await pending;
  expect(controller.getSnapshot().data.sessions).toHaveLength(0);
});

it("keeps a confirmed revocation visible when the following refresh fails", async () => {
  const api = client();
  const controller = new AppAccessController(createAppAccessGateway(api), 0);
  await controller.refresh();
  vi.mocked(api.get).mockRejectedValue(new Error("Offline"));
  const result = await controller.revoke([grant("one")]);
  expect(result.succeeded).toHaveLength(1);
  expect(controller.getSnapshot().data.sessions[0].status).toBe("revoked");
});

it("does not publish a completed mutation after the page closes", async () => {
  const api = client();
  const controller = new AppAccessController(createAppAccessGateway(api), 0);
  await controller.refresh();
  let complete!: (value: unknown) => void;
  vi.mocked(api.post).mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const pending = controller.revoke([grant("one")]);
  await Promise.resolve();
  controller.stop();
  const closed = controller.getSnapshot();
  complete({});
  await pending;
  expect(controller.getSnapshot()).toBe(closed);
});
