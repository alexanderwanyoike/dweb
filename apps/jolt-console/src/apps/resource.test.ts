import { expect, it, vi } from "vitest";
import { PermissionsResource } from "./resource";
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
  const resource = new PermissionsResource(api, 0);
  await Promise.all([resource.refresh(), resource.refresh()]);
  expect(api.get).toHaveBeenCalledTimes(3);
  vi.mocked(api.get).mockRejectedValue(new Error("Offline"));
  await resource.refresh();
  expect(resource.getSnapshot().data.sessions).toHaveLength(1);
  expect(resource.getSnapshot().error).toBe("Offline");
});
it("ignores old responses after the resource stops", async () => {
  const api = client();
  const resource = new PermissionsResource(api, 0);
  const pending = resource.refresh();
  resource.stop();
  await pending;
  expect(resource.getSnapshot().data.sessions).toHaveLength(0);
});
it("keeps a confirmed revocation visible when the following refresh fails", async () => {
  const api = client();
  const resource = new PermissionsResource(api, 0);
  await resource.refresh();
  vi.mocked(api.get).mockRejectedValue(new Error("Offline"));
  const result = await resource.revoke([grant("one")]);
  expect(result.succeeded).toHaveLength(1);
  expect(resource.getSnapshot().data.sessions[0].status).toBe("revoked");
});
it("does not publish a completed mutation after the page closes", async () => {
  const api = client();
  const resource = new PermissionsResource(api, 0);
  await resource.refresh();
  let complete!: (value: unknown) => void;
  vi.mocked(api.post).mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const pending = resource.revoke([grant("one")]);
  await Promise.resolve();
  resource.stop();
  const closed = resource.getSnapshot();
  complete({});
  await pending;
  expect(resource.getSnapshot()).toBe(closed);
});
