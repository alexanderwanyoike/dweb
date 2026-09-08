import { createAppAccessGateway } from "./gateway";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppsPage } from "./AppsPage";
import { grant } from "./fixtures.test-support";
import type { DaemonClient } from "../daemon/client";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

it("shows one app for multiple identities and reviews exact sessions before revoking", async () => {
  const sessions = [
    grant("one"),
    grant("two", { identity: "bob.jolt", app_origin: "http://localhost:5179" }),
  ];
  const client = {
    daemonUrl: "",
    get: vi.fn(async (path: string) => {
      if (path.endsWith("/sessions")) return sessions;
      if (path.endsWith("identities"))
        return { identities: [], active_identity: "alice.jolt" };
      return [];
    }),
    post: vi.fn(async () => ({})),
  } as unknown as DaemonClient;
  render(
    <AppsPage gateway={createAppAccessGateway(client)} refreshIntervalMs={0} />,
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Manage Spoke access" }),
  );
  expect(
    screen.getAllByRole("button", { name: "Manage Spoke access" }),
  ).toHaveLength(1);
  await userEvent.click(
    screen.getByRole("button", { name: "Revoke Spoke access" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Revoke Spoke access?" });
  expect(within(dialog).getByText("alice.jolt")).toBeVisible();
  expect(within(dialog).getByText("bob.jolt")).toBeVisible();
  expect(client.post).not.toHaveBeenCalled();
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Revoke access" }),
  );
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-access/sessions/one/revoke",
  );
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-access/sessions/two/revoke",
  );
});

it("keeps partial failures visible and retries only the failed sessions", async () => {
  let sessions = [grant("one"), grant("two")];
  let failSecond = true;
  const client = {
    daemonUrl: "",
    get: vi.fn(async (path: string) => {
      if (path.endsWith("/sessions")) return sessions;
      if (path.endsWith("identities"))
        return { identities: [], active_identity: null };
      return [];
    }),
    post: vi.fn(async (path: string) => {
      if (path.includes("/two/") && failSecond)
        throw new Error("Connection lost");
      sessions = sessions.map((session) =>
        path.includes(`/${session.session_id}/`)
          ? { ...session, status: "revoked" }
          : session,
      );
      return {};
    }),
  } as unknown as DaemonClient;
  render(
    <AppsPage gateway={createAppAccessGateway(client)} refreshIntervalMs={0} />,
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Manage Spoke access" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Revoke Spoke access" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Revoke access" }));
  expect(
    await screen.findByText("1 revoked. 1 could not be confirmed."),
  ).toBeVisible();
  expect(
    screen.getByText(/Treat this session as still authorised/),
  ).toBeVisible();
  failSecond = false;
  await userEvent.click(
    screen.getByRole("button", { name: "Retry failed sessions" }),
  );
  expect(
    await screen.findByText("2 revoked. 0 could not be confirmed."),
  ).toBeVisible();
  expect(vi.mocked(client.post).mock.calls.map(([path]) => path)).toEqual([
    "/admin/v1/app-access/sessions/one/revoke",
    "/admin/v1/app-access/sessions/two/revoke",
    "/admin/v1/app-access/sessions/two/revoke",
  ]);
  await userEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(screen.getByText("No active access")).toBeVisible();
});

function localIdentitiesPayload() {
  return {
    active_identity: "alice.jolt",
    identities: [{ address: "alice.jolt", label: "Default", active: true }],
  };
}

it("renders app permission requests and can approve, reject, and revoke grants", async () => {
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/app-access/requests") {
        return [
          {
            request_id: "req_scratch",
            app_id: "scratch.local",
            app_name: "Scratch",
            app_origin: "http://127.0.0.1:5190",
            requested_identity: "alice.jolt",
            requested_capabilities: ["resolve:public"],
            granted_capabilities: [],
            status: "pending",
            created_at: 1_780_000_300,
          },
          {
            request_id: "req_pastey",
            app_id: "pastey.local",
            app_name: "Pastey",
            app_origin: "http://127.0.0.1:5174",
            requested_identity: "alice.jolt",
            requested_capabilities: [
              "resolve:public",
              "fetch:public",
              "publish:/pastes/*",
              "pin:own:/pastes/*",
              "export:keys",
            ],
            granted_capabilities: [],
            status: "pending",
            created_at: 1_780_000_000,
          },
          {
            request_id: "req_rejected",
            app_id: "archiver.local",
            app_name: "Archiver",
            app_origin: "http://127.0.0.1:5191",
            requested_identity: "alice.jolt",
            requested_capabilities: ["resolve:public"],
            granted_capabilities: [],
            status: "rejected",
            created_at: 1_780_000_200,
            rejected_at: 1_780_000_250,
          },
        ];
      }
      if (path === "/admin/v1/app-access/sessions") {
        return [
          {
            request_id: "req_pastey_active",
            session_id: "sess_pastey",
            app_id: "pastey.local",
            app_name: "Pastey",
            app_origin: "http://127.0.0.1:5174",
            identity: "alice.jolt",
            requested_capabilities: ["resolve:public", "publish:/pastes/*"],
            granted_capabilities: ["resolve:public", "publish:/pastes/*"],
            status: "active",
            created_at: 1_780_000_300,
            approved_at: 1_780_000_300,
            last_used_at: 1_780_000_400,
          },
          {
            request_id: "req_notes",
            session_id: "sess_notes",
            app_id: "notes.local",
            app_name: "Notes",
            identity: "alice.jolt",
            requested_capabilities: ["resolve:public"],
            granted_capabilities: ["resolve:public"],
            status: "active",
            created_at: 1_780_000_000,
            approved_at: 1_780_000_100,
            last_used_at: 1_780_000_200,
          },
        ];
      }
      if (path === "/admin/v1/identities") return localIdentitiesPayload();
      throw new Error(`unexpected path ${path}`);
    }),
    post: vi.fn(async () => ({ ok: true })),
  };

  render(<AppsPage gateway={createAppAccessGateway(client)} />);

  const pendingRows = await screen.findAllByRole("button", {
    name: /request details/i,
  });
  expect(pendingRows[0]).toHaveTextContent("Scratch");
  expect(pendingRows[1]).toHaveTextContent("Pastey");
  expect(pendingRows[2]).toHaveTextContent("Archiver");
  await userEvent.click(screen.getByText("Rejected requests (1)"));
  expect(
    screen.getByRole("button", { name: /Archiver.*request details/i }),
  ).toHaveTextContent("rejected");

  expect(
    screen.queryByText("create or update signed paths under /pastes/*"),
  ).not.toBeInTheDocument();

  await userEvent.click(pendingRows[1]);
  expect(screen.getAllByText("alice.jolt")).not.toHaveLength(0);
  expect(
    screen.getByText("create or update signed paths under /pastes/*"),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "This request includes permissions Console cannot approve.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Approve Pastey" })).toBeDisabled();

  await userEvent.click(
    screen.getByRole("button", { name: "Manage Notes access" }),
  );

  await userEvent.click(screen.getByRole("button", { name: "Reject Pastey" }));
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-requests/req_pastey/reject",
  );

  await userEvent.click(
    screen.getByRole("button", { name: "Revoke Notes access" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Revoke access" }));
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-access/sessions/sess_notes/revoke",
  );
});

it("can approve scoped encrypted Pastey capabilities", async () => {
  const requestedCapabilities = [
    "resolve:public",
    "fetch:public",
    "publish:/pastes/*",
    "publish:encrypted:/pastes/*",
    "inventory:/pastes/*",
    "pin:own:/pastes/*",
    "encrypt:/pastes/*",
    "decrypt:/pastes/*",
  ];
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/app-access/requests") {
        return [
          {
            request_id: "req_private_pastey",
            app_id: "pastey.local",
            app_name: "Pastey",
            app_origin: "http://127.0.0.1:5174",
            requested_identity: "alice.jolt",
            requested_capabilities: requestedCapabilities,
            granted_capabilities: [],
            status: "pending",
            created_at: 1_780_000_500,
          },
        ];
      }
      if (path === "/admin/v1/app-access/sessions") return [];
      if (path === "/admin/v1/identities") return localIdentitiesPayload();
      throw new Error(`unexpected path ${path}`);
    }),
    post: vi.fn(async () => ({ ok: true })),
  };

  render(<AppsPage gateway={createAppAccessGateway(client)} />);

  await userEvent.click(
    await screen.findByRole("button", { name: /request details/i }),
  );
  expect(
    screen.getByText("publish encrypted content under /pastes/*"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("encrypt content under /pastes/*"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("decrypt content under /pastes/*"),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      "This request includes permissions Console cannot approve.",
    ),
  ).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Approve Pastey" }));
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-requests/req_private_pastey/approve",
    {
      identity: "alice.jolt",
      capabilities: requestedCapabilities,
      expires_at: null,
    },
  );
});

it("can approve Chirp Data SDK capabilities", async () => {
  const requestedCapabilities = [
    "resolve:public",
    "fetch:public",
    "publish:/chirp/posts/*",
    "delete:/chirp/posts/*",
    "publish:/chirp/following",
    "subscribe:any:/chirp/posts/*",
  ];
  const client = pendingChirpRequestClient(requestedCapabilities);

  render(<AppsPage gateway={createAppAccessGateway(client)} />);

  await userEvent.click(
    await screen.findByRole("button", { name: /request details/i }),
  );
  expect(
    screen.getByText("delete records under /chirp/posts/*"),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "subscribe to verified records under /chirp/posts/* for any identity",
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      "This request includes permissions Console cannot approve.",
    ),
  ).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Approve Chirp" }));
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-requests/req_chirp/approve",
    {
      identity: "alice.jolt",
      capabilities: requestedCapabilities,
      expires_at: null,
    },
  );
});

it("blocks a subscription for a malformed exact identity", async () => {
  const malformedCapability = "subscribe:a.jolt:/chirp/posts/*";
  await expectChirpCapabilityBlocked(malformedCapability);
  expect(screen.getByText(malformedCapability)).toBeInTheDocument();
});

it("blocks a delete capability with a malformed wildcard scope", async () => {
  await expectChirpCapabilityBlocked("delete:/chirp/posts/*/archive");
});

it("blocks a subscription capability with a malformed path scope", async () => {
  await expectChirpCapabilityBlocked("subscribe:any:/chirp/posts?private");
});

it("can approve a subscription for one exact identity", async () => {
  const identity = "boraugen54xu6zhtctqpmtqrx4ep26el4cjkw45iv4ev2jmbs2eq.jolt";
  const capability = `subscribe:${identity}:/chirp/posts/*`;
  const client = pendingChirpRequestClient([capability]);

  render(<AppsPage gateway={createAppAccessGateway(client)} />);

  await userEvent.click(
    await screen.findByRole("button", { name: /request details/i }),
  );
  expect(
    screen.getByText(
      `subscribe to verified records under /chirp/posts/* for ${identity}`,
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      "This request includes permissions Console cannot approve.",
    ),
  ).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Approve Chirp" }));
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-requests/req_chirp/approve",
    {
      identity: "alice.jolt",
      capabilities: [capability],
      expires_at: null,
    },
  );
});

it("can approve Spoke ingress review capabilities", async () => {
  const requestedCapabilities = [
    "resolve:public",
    "fetch:public",
    "publish:/spoke/*",
    "publish:encrypted:/spoke/*",
    "inventory:/spoke/*",
    "pin:own:/spoke/*",
    "encrypt:/spoke/*",
    "decrypt:/spoke/*",
    "ingress:send",
    "ingress:read",
    "ingress:decide",
  ];
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/app-access/requests") {
        return [
          {
            request_id: "req_spoke",
            app_id: "spoke.local",
            app_name: "Spoke",
            app_origin: "http://127.0.0.1:5178",
            requested_identity: "alice.jolt",
            requested_capabilities: requestedCapabilities,
            granted_capabilities: [],
            status: "pending",
            created_at: 1_780_000_600,
          },
        ];
      }
      if (path === "/admin/v1/app-access/sessions") return [];
      if (path === "/admin/v1/identities") return localIdentitiesPayload();
      throw new Error(`unexpected path ${path}`);
    }),
    post: vi.fn(async () => ({ ok: true })),
  };

  render(<AppsPage gateway={createAppAccessGateway(client)} />);

  await userEvent.click(
    await screen.findByRole("button", { name: /request details/i }),
  );
  expect(
    screen.getByText("send incoming app objects by identity"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("read pending incoming app objects"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("accept or reject pending incoming app objects"),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      "This request includes permissions Console cannot approve.",
    ),
  ).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Approve Spoke" }));
  expect(client.post).toHaveBeenCalledWith(
    "/admin/v1/app-requests/req_spoke/approve",
    {
      identity: "alice.jolt",
      capabilities: requestedCapabilities,
      expires_at: null,
    },
  );
});

it("shows the active local identity for app requests without an explicit identity", async () => {
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/app-access/requests") {
        return [
          {
            request_id: "req_selected_identity",
            app_id: "scratch.local",
            app_name: "Scratch",
            requested_identity: null,
            requested_capabilities: ["resolve:public"],
            granted_capabilities: [],
            status: "pending",
            created_at: 1_780_000_700,
          },
        ];
      }
      if (path === "/admin/v1/app-access/sessions") return [];
      if (path === "/admin/v1/identities") {
        return {
          active_identity: "work.jolt",
          identities: [
            { address: "alice.jolt", label: "Default", active: false },
            { address: "work.jolt", label: "Work", active: true },
          ],
        };
      }
      throw new Error(`unexpected path ${path}`);
    }),
    post: vi.fn(async () => ({ ok: true })),
  };

  render(<AppsPage gateway={createAppAccessGateway(client)} />);

  const request = await screen.findByRole("button", {
    name: /request details/i,
  });
  expect(request).toHaveTextContent("work.jolt");

  await userEvent.click(request);
  expect(screen.getAllByText("work.jolt")).not.toHaveLength(0);
});

it("renders apps empty state when there are no requests or sessions", async () => {
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/app-access/requests") return [];
      if (path === "/admin/v1/app-access/sessions") return [];
      if (path === "/admin/v1/identities") return localIdentitiesPayload();
      throw new Error(path);
    }),
    post: vi.fn(),
  };

  render(<AppsPage gateway={createAppAccessGateway(client)} />);

  expect(await screen.findByText("No app requests yet.")).toBeInTheDocument();
  expect(screen.getByText("A place for your apps.")).toBeInTheDocument();
});

it("updates app permission requests without manual refresh", async () => {
  vi.useFakeTimers();
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/app-access/requests") {
        const requestCalls = vi
          .mocked(client.get)
          .mock.calls.filter(
            ([calledPath]) => calledPath === "/admin/v1/app-access/requests",
          ).length;
        return requestCalls < 2
          ? []
          : [
              {
                request_id: "req_pastey",
                app_id: "pastey.local",
                app_name: "Pastey",
                app_origin: "http://127.0.0.1:5174",
                requested_identity: "alice.jolt",
                requested_capabilities: ["resolve:public"],
                granted_capabilities: [],
                status: "pending",
                created_at: 1_780_000_000,
              },
            ];
      }
      if (path === "/admin/v1/app-access/sessions") return [];
      if (path === "/admin/v1/identities") return localIdentitiesPayload();
      throw new Error(`unexpected path ${path}`);
    }),
    post: vi.fn(),
  };

  render(
    <AppsPage
      gateway={createAppAccessGateway(client)}
      refreshIntervalMs={1000}
    />,
  );

  await act(async () => {});
  expect(screen.getByText("No app requests yet.")).toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });

  expect(
    screen.queryByRole("button", { name: /request details/i }),
  ).toHaveTextContent("Pastey");
});

it("backs off app permission polling after an API failure", async () => {
  vi.useFakeTimers();
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/app-access/requests") {
        throw new Error("daemon offline");
      }
      if (path === "/admin/v1/app-access/sessions") return [];
      if (path === "/admin/v1/identities") return localIdentitiesPayload();
      throw new Error(`unexpected path ${path}`);
    }),
    post: vi.fn(),
  };

  render(
    <AppsPage
      gateway={createAppAccessGateway(client)}
      refreshIntervalMs={1000}
    />,
  );

  await act(async () => {});
  expect(screen.getByText(/daemon offline/)).toBeInTheDocument();
  expect(client.get).toHaveBeenCalledTimes(3);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(client.get).toHaveBeenCalledTimes(3);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(client.get).toHaveBeenCalledTimes(6);
});

it("updates active and revoked app sessions without manual refresh", async () => {
  vi.useFakeTimers();
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/app-access/requests") return [];
      if (path === "/admin/v1/app-access/sessions") {
        const sessionCalls = vi
          .mocked(client.get)
          .mock.calls.filter(
            ([calledPath]) => calledPath === "/admin/v1/app-access/sessions",
          ).length;
        return [
          {
            request_id: "req_pastey",
            session_id: "sess_pastey",
            app_id: "pastey.local",
            app_name: "Pastey",
            app_origin: "http://127.0.0.1:5174",
            identity: "alice.jolt",
            requested_capabilities: ["resolve:public"],
            granted_capabilities: ["resolve:public"],
            status: sessionCalls < 2 ? "active" : "revoked",
            created_at: 1_780_000_000,
            approved_at: 1_780_000_000,
            revoked_at: sessionCalls < 2 ? null : 1_780_000_500,
          },
        ];
      }
      if (path === "/admin/v1/identities") return localIdentitiesPayload();
      throw new Error(`unexpected path ${path}`);
    }),
    post: vi.fn(),
  };

  render(
    <AppsPage
      gateway={createAppAccessGateway(client)}
      refreshIntervalMs={1000}
    />,
  );

  await act(async () => {});
  expect(screen.getByText("Access allowed")).toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });

  expect(screen.getByText("No active access")).toBeInTheDocument();
});

function pendingChirpRequestClient(
  requestedCapabilities: string[],
): DaemonClient {
  return {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/app-access/requests") {
        return [
          {
            request_id: "req_chirp",
            app_id: "chirp.example",
            app_name: "Chirp",
            app_origin: "http://127.0.0.1:1430",
            requested_identity: "alice.jolt",
            requested_capabilities: requestedCapabilities,
            granted_capabilities: [],
            status: "pending",
            created_at: 1_788_082_165,
          },
        ];
      }
      if (path === "/admin/v1/app-access/sessions") return [];
      if (path === "/admin/v1/identities") return localIdentitiesPayload();
      throw new Error(`unexpected path ${path}`);
    }),
    post: vi.fn(async () => ({ ok: true })),
  };
}

async function expectChirpCapabilityBlocked(capability: string) {
  const client = pendingChirpRequestClient(["resolve:public", capability]);

  render(<AppsPage gateway={createAppAccessGateway(client)} />);

  await userEvent.click(
    await screen.findByRole("button", { name: /request details/i }),
  );
  expect(
    screen.getByText(
      "This request includes permissions Console cannot approve.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Approve Chirp" })).toBeDisabled();
  expect(client.post).not.toHaveBeenCalled();
}
