import type { IdentityRecoveryFileClient } from "./recovery-file";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, it, expect, vi } from "vitest";
import { IdentityPage } from "./IdentityPage";
import type { DaemonClient } from "../daemon/client";
import type { DaemonLifecycleClient } from "../daemon/lifecycle";
import { snapshot } from "../test/snapshot";
afterEach(cleanup);
function daemonClient(): DaemonClient {
  return {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(),
    post: vi.fn(async () => ({
      active_identity: "work.jolt",
      identities: [
        { address: "alice.jolt", label: "Default", active: false },
        { address: "work.jolt", label: "Work", active: true }
      ]
    })),
    delete: vi.fn(async () => ({
      active_identity: "alice.jolt",
      identities: [{ address: "alice.jolt", label: "Default", active: true }]
    }))
  };
}

it("renders the current identity page", () => {
  render(<IdentityPage client={daemonClient()} snapshot={snapshot()} />);

  expect(screen.getByRole("heading", { name: "Default" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Work" })).toBeVisible();
  expect(screen.queryByLabelText("Identity name")).not.toBeInTheDocument();
});

it("selects local identities from the identity page", async () => {
  const refresh = vi.fn(async () => true);
  const client = daemonClient();

  render(<IdentityPage client={client} snapshot={snapshot({ refresh })} />);

  await userEvent.click(screen.getByRole("button", { name: "Use Work" }));

  expect(client.post).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Confirm selection" }));
  expect(client.post).toHaveBeenCalledWith("/admin/v1/identities/active", {
    identity: "work.jolt"
  });
  expect(refresh).toHaveBeenCalledOnce();
});

it("creates named identities from the identity page", async () => {
  const refresh = vi.fn(async () => true);
  const client = daemonClient();

  render(<IdentityPage client={client} snapshot={snapshot({ refresh })} />);

  await userEvent.click(screen.getByRole("button", { name: "Add identity" }));
  await userEvent.type(screen.getByLabelText("Identity name"), "Side project");
  await userEvent.click(screen.getByRole("button", { name: "Create identity" }));

  expect(client.post).toHaveBeenCalledWith("/admin/v1/identities", {
    label: "Side project"
  });
  expect(refresh).toHaveBeenCalledOnce();
});

it("deletes generated identities from the identity page", async () => {
  const refresh = vi.fn(async () => true);
  const client = daemonClient();

  render(<IdentityPage client={client} snapshot={snapshot({ refresh })} />);

  await userEvent.click(screen.getByRole("button", { name: "Remove Work" }));

  expect(client.delete).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Remove identity" }));
  expect(client.delete).toHaveBeenCalledWith("/admin/v1/identities/work.jolt");
  expect(refresh).toHaveBeenCalledOnce();
});

it("exports the daemon identity through the native save dialog", async () => {
  const bundle = {
    magic: "jolt.identity.export",
    version: 1,
    identity: "alice.jolt",
    created_at: 1_780_000_000,
    kdf: { name: "argon2id", salt: "salt" },
    cipher: { name: "xchacha20poly1305", nonce: "nonce" },
    ciphertext: "ciphertext"
  };
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(),
    post: vi.fn(async () => ({
      identity: "alice.jolt",
      encryption_key_count: 1,
      bundle
    }))
  };
  const recoveryFileClient: IdentityRecoveryFileClient = {
    save: vi.fn(async () => "/tmp/alice.jolt-identity"),
    open: vi.fn()
  };

  render(
    <IdentityPage client={client} snapshot={snapshot()} recoveryFileClient={recoveryFileClient} />
  );

  await userEvent.click(screen.getByRole("button", { name: "Back up an identity" }));
  expect(
    screen.queryByLabelText("I understand this exports private identity keys.")
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "Anyone with the export file can become this identity unless you add a passphrase."
    )
  ).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("Label"), "Laptop");
  await userEvent.click(screen.getByRole("button", { name: "Export identity" }));

  expect(client.post).toHaveBeenCalledWith("/admin/v1/identities/export", {
    identity: "alice.jolt",
    passphrase: null,
    label: "Laptop"
  });
  expect(recoveryFileClient.save).toHaveBeenCalledWith("alice.jolt", bundle);
  expect(screen.getByText("Exported alice.jolt to /tmp/alice.jolt-identity.")).toBeInTheDocument();
  expect(screen.queryByLabelText("Export bundle")).not.toBeInTheDocument();
});

it("exports the selected local identity through the native save dialog", async () => {
  const bundle = {
    magic: "jolt.identity.export",
    version: 1,
    identity: "work.jolt",
    created_at: 1_780_000_000,
    kdf: { name: "argon2id", salt: "salt" },
    cipher: { name: "xchacha20poly1305", nonce: "nonce" },
    ciphertext: "ciphertext"
  };
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(),
    post: vi.fn(async () => ({
      identity: "work.jolt",
      encryption_key_count: 0,
      bundle
    }))
  };
  const recoveryFileClient: IdentityRecoveryFileClient = {
    save: vi.fn(async () => "/tmp/work.jolt-identity"),
    open: vi.fn()
  };

  render(
    <IdentityPage client={client} snapshot={snapshot()} recoveryFileClient={recoveryFileClient} />
  );

  await userEvent.click(screen.getByRole("button", { name: "Back up an identity" }));
  await userEvent.selectOptions(screen.getByLabelText("Identity"), "work.jolt");
  await userEvent.click(screen.getByRole("button", { name: "Export identity" }));

  expect(client.post).toHaveBeenCalledWith("/admin/v1/identities/export", {
    identity: "work.jolt",
    passphrase: null,
    label: null
  });
  expect(recoveryFileClient.save).toHaveBeenCalledWith("work.jolt", bundle);
  expect(screen.getByText("Exported work.jolt to /tmp/work.jolt-identity.")).toBeInTheDocument();
});

it("imports an identity bundle through the native open dialog", async () => {
  const refresh = vi.fn(async () => true);
  const bundle = {
    magic: "jolt.identity.export",
    version: 1,
    identity: "alice.jolt",
    created_at: 1_780_000_000,
    kdf: { name: "argon2id", salt: "salt" },
    cipher: { name: "xchacha20poly1305", nonce: "nonce" },
    ciphertext: "ciphertext"
  };
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(),
    post: vi.fn(async () => ({
      identity: "alice.jolt",
      imported: true,
      restart_required: false,
      encryption_key_count: 1,
      app_sessions_imported: false
    }))
  };
  const recoveryFileClient: IdentityRecoveryFileClient = {
    save: vi.fn(),
    open: vi.fn(async () => bundle)
  };
  const lifecycleClient: DaemonLifecycleClient = {
    status: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(async () => ({
      daemon_url: "http://127.0.0.1:9862",
      reachability: "healthy",
      ownership: "console",
      pid: 123,
      message: "Console owns this daemon.",
      last_error: null,
      log_tail: []
    }))
  };

  render(
    <IdentityPage
      client={client}
      snapshot={snapshot({ refresh })}
      recoveryFileClient={recoveryFileClient}
      lifecycleClient={lifecycleClient}
    />
  );

  expect(screen.queryByLabelText("Identity bundle file")).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("I understand this imports private identity keys.")
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Passphrase")).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("Allow replacing the existing daemon identity.")
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Restore from a file" }));
  expect(
    screen.getByText(
      "Import validates the bundle and adds it as a local identity without replacing the daemon identity."
    )
  ).toBeInTheDocument();
  if (!screen.queryByRole("dialog"))
    await userEvent.click(screen.getByRole("button", { name: "Restore from a file" }));
  await userEvent.click(screen.getByRole("button", { name: "Import identity" }));

  expect(recoveryFileClient.open).toHaveBeenCalledOnce();
  expect(client.post).toHaveBeenCalledWith("/admin/v1/identities/import", {
    passphrase: null,
    bundle,
    allow_overwrite: false,
    as_local_identity: true
  });
  expect(lifecycleClient.restart).not.toHaveBeenCalled();
  expect(screen.getByText("Imported alice.jolt as a local identity.")).toBeInTheDocument();
  expect(refresh).toHaveBeenCalledOnce();
});

it("asks for an import passphrase only after the selected bundle requires one", async () => {
  const refresh = vi.fn(async () => true);
  const bundle = {
    magic: "jolt.identity.export",
    version: 1,
    identity: "alice.jolt",
    created_at: 1_780_000_000,
    kdf: { name: "argon2id", salt: "salt" },
    cipher: { name: "xchacha20poly1305", nonce: "nonce" },
    ciphertext: "ciphertext"
  };
  const client: DaemonClient = {
    daemonUrl: "http://127.0.0.1:9862",
    get: vi.fn(),
    post: vi
      .fn()
      .mockRejectedValueOnce(
        new Error(
          'daemon returned 400 Bad Request: {"code":"identity_recovery_invalid","error":"identity export/import failed: identity export passphrase is incorrect or bundle was tampered with"}'
        )
      )
      .mockResolvedValueOnce({
        identity: "alice.jolt",
        imported: true,
        restart_required: false,
        encryption_key_count: 1,
        app_sessions_imported: false
      })
  };
  const recoveryFileClient: IdentityRecoveryFileClient = {
    save: vi.fn(),
    open: vi.fn(async () => bundle)
  };

  render(
    <IdentityPage
      client={client}
      snapshot={snapshot({ refresh })}
      recoveryFileClient={recoveryFileClient}
    />
  );

  expect(screen.queryByLabelText("Passphrase")).not.toBeInTheDocument();
  if (!screen.queryByRole("dialog"))
    await userEvent.click(screen.getByRole("button", { name: "Restore from a file" }));
  await userEvent.click(screen.getByRole("button", { name: "Import identity" }));

  expect(recoveryFileClient.open).toHaveBeenCalledOnce();
  expect(client.post).toHaveBeenNthCalledWith(1, "/admin/v1/identities/import", {
    passphrase: null,
    bundle,
    allow_overwrite: false,
    as_local_identity: true
  });
  expect(await screen.findByLabelText("Passphrase")).toBeInTheDocument();
  expect(screen.getByText("This identity export needs a passphrase.")).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText("Passphrase"), "correct horse");
  await userEvent.click(screen.getByRole("button", { name: "Unlock and import" }));

  expect(recoveryFileClient.open).toHaveBeenCalledOnce();
  expect(client.post).toHaveBeenNthCalledWith(2, "/admin/v1/identities/import", {
    passphrase: "correct horse",
    bundle,
    allow_overwrite: false,
    as_local_identity: true
  });
  expect(screen.getByText("Imported alice.jolt as a local identity.")).toBeInTheDocument();
  expect(screen.queryByLabelText("Passphrase")).not.toBeInTheDocument();
  expect(refresh).toHaveBeenCalledOnce();
});
