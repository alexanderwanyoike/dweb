import { expect, it, vi } from "vitest";
import { revokeSessions, approveRequest } from "./commands";
import { grant } from "./fixtures.test-support";
import type { DaemonClient } from "../daemon/client";
it("reports partial revocation and retries only the failed session", async () => {
  const client = {
    post: vi
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Offline")),
  } as unknown as DaemonClient;
  const result = await revokeSessions(client, [
    grant("one"),
    grant("two"),
    grant("old", { status: "revoked" }),
  ]);
  expect(result.succeeded.map((s) => s.session_id)).toEqual(["one"]);
  expect(result.failed.map((f) => f.session.session_id)).toEqual(["two"]);
  client.post = vi.fn().mockResolvedValue({});
  await revokeSessions(
    client,
    result.failed.map((f) => f.session),
  );
  expect(client.post).toHaveBeenCalledExactlyOnceWith(
    "/admin/v1/app-access/sessions/two/revoke",
  );
});
it("does not silently approve a narrower subset of unknown requested permissions", async () => {
  const client = { post: vi.fn() } as unknown as DaemonClient;
  await expect(
    approveRequest(
      client,
      grant("one", {
        status: "pending",
        requested_capabilities: ["resolve:public", "unknown:grant"],
      }),
    ),
  ).rejects.toThrow();
  expect(client.post).not.toHaveBeenCalled();
});
