import { cleanup, render as renderView, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import type { DaemonClient } from "../daemon/client";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
function render(view: ReactNode) {
  return renderView(<MemoryRouter>{view}</MemoryRouter>);
}
afterEach(cleanup);
import { RelaysPage } from "./RelaysPage";
it("renders and updates daemon network settings", async () => {
  const relay =
    "/ip4/89.167.68.65/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN";
  const builtIn =
    "/dns4/bootstrap.jolt.test/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN";
  const lifecycleClient: DaemonLifecycleClient = {
    status: vi.fn(async () => ({
      daemon_url: "http://127.0.0.1:9862",
      reachability: "healthy",
      ownership: "external",
      message: "Connected to an externally started daemon",
    })),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(),
  };
  const networkPayload = {
    configured_bootstrap_relays: [relay],
    built_in_bootstrap_relays: [builtIn],
    effective_bootstrap_relays: [relay],
    configured_bootstrap_relay_count: 1,
    built_in_bootstrap_relay_count: 1,
    effective_bootstrap_relay_count: 1,
    use_builtin_bootstrap_relays: true,
    bootstrap_relay: false,
    home_relay: null,
  };
  const daemonClient: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(async (path: string) => {
      if (path === "/admin/v1/network-settings") return networkPayload;
      if (path === "/api/v1/status") {
        return {
          bootstrap_state: "connected",
          connected_bootstrap_peers: 1,
          known_relay_count: 2,
        };
      }
      throw new Error(path);
    }),
    post: vi.fn(async (path: string) => {
      if (path === "/admin/v1/bootstrap-relays") return networkPayload;
      if (path === "/admin/v1/bootstrap-relays/remove") {
        return { ...networkPayload, configured_bootstrap_relays: [] };
      }
      if (path === "/admin/v1/home-relay") {
        return {
          ...networkPayload,
          home_relay: {
            peer_id: "12D3KooRelay",
            multiaddr: relay,
            capability: "pinning",
            api_url: "http://127.0.0.1:9870",
          },
        };
      }
      if (path === "/admin/v1/home-relay/clear") return networkPayload;
      throw new Error(path);
    }),
  };

  render(<RelaysPage client={daemonClient} />);

  expect(
    await screen.findByText("Configured bootstrap relays"),
  ).toBeInTheDocument();
  expect(screen.getAllByText(relay).length).toBeGreaterThan(0);
  expect(screen.getByText(builtIn)).toBeInTheDocument();
  expect(screen.getByText("Effective at startup")).toBeInTheDocument();

  await userEvent.click(screen.getByText("Add a bootstrap relay"));
  await userEvent.clear(screen.getByLabelText("Bootstrap relay multiaddr"));
  await userEvent.type(
    screen.getByLabelText("Bootstrap relay multiaddr"),
    relay,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Add bootstrap relay" }),
  );
  expect(daemonClient.post).toHaveBeenCalledWith("/admin/v1/bootstrap-relays", {
    multiaddr: relay,
  });

  await userEvent.click(
    screen.getByRole("button", { name: "Remove bootstrap relay" }),
  );
  expect(daemonClient.post).toHaveBeenCalledWith(
    "/admin/v1/bootstrap-relays/remove",
    {
      multiaddr: relay,
    },
  );

  await userEvent.click(screen.getByText("Configure home relay"));
  await userEvent.clear(screen.getByLabelText("Home relay multiaddr"));
  await userEvent.type(screen.getByLabelText("Home relay multiaddr"), relay);
  await userEvent.clear(screen.getByLabelText("Home relay API URL"));
  await userEvent.type(
    screen.getByLabelText("Home relay API URL"),
    "http://127.0.0.1:9870",
  );
  await userEvent.click(screen.getByRole("button", { name: "Set home relay" }));
  expect(daemonClient.post).toHaveBeenCalledWith("/admin/v1/home-relay", {
    multiaddr: relay,
    capability: "pinning",
    api_url: "http://127.0.0.1:9870",
  });
  expect(await screen.findByText("12D3KooRelay")).toBeInTheDocument();

  vi.mocked(daemonClient.post).mockRejectedValueOnce(
    new Error("invalid home relay API URL"),
  );
  await userEvent.click(screen.getByRole("button", { name: "Set home relay" }));
  expect(screen.getByText(/invalid home relay API URL/)).toBeInTheDocument();
});
