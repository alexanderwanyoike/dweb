import { describe, expect, it, vi } from "vitest";
import { createAppAccessGateway } from "./gateway";
import { grant } from "./fixtures.test-support";
import type { DaemonClient } from "../daemon/client";

it("reports partial revocation and retries only the failed session", async () => {
  const client = {
    post: vi
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Offline")),
  } as unknown as DaemonClient;
  const result = await createAppAccessGateway(client).revoke([
    grant("one"),
    grant("two"),
    grant("old", { status: "revoked" }),
  ]);
  expect(result.succeeded.map((s) => s.session_id)).toEqual(["one"]);
  expect(result.failed.map((f) => f.session.session_id)).toEqual(["two"]);
  client.post = vi.fn().mockResolvedValue({});
  await createAppAccessGateway(client).revoke(
    result.failed.map((f) => f.session),
  );
  expect(client.post).toHaveBeenCalledExactlyOnceWith(
    "/admin/v1/app-access/sessions/two/revoke",
  );
});

it("does not silently approve a narrower subset of unknown requested permissions", async () => {
  const client = { post: vi.fn() } as unknown as DaemonClient;
  await expect(
    createAppAccessGateway(client).approve(
      grant("one", {
        status: "pending",
        requested_capabilities: ["resolve:public", "unknown:grant"],
      }),
    ),
  ).rejects.toThrow();
  expect(client.post).not.toHaveBeenCalled();
});

describe("app access loading", () => {
  it("loads pending requests and sessions from the admin permission endpoints", async () => {
    const client: DaemonClient = {
      daemonUrl: "http://127.0.0.1:9862",
      get: vi.fn(async (path: string) => {
        if (path === "/admin/v1/app-access/requests")
          return [{ request_id: "req_1" }];
        if (path === "/admin/v1/app-access/sessions")
          return [{ session_id: "sess_1" }];
        if (path === "/admin/v1/identities") {
          return {
            active_identity: "alice.jolt",
            identities: [
              { address: "alice.jolt", label: "Default", active: true },
            ],
          };
        }
        throw new Error(path);
      }),
      post: vi.fn(),
    };

    await expect(createAppAccessGateway(client).load()).resolves.toEqual({
      requests: [{ request_id: "req_1" }],
      sessions: [{ session_id: "sess_1" }],
      localIdentities: {
        active_identity: "alice.jolt",
        identities: [{ address: "alice.jolt", label: "Default", active: true }],
      },
    });
  });
});
