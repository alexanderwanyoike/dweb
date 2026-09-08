import { describe, it, expect, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  createLocalIdentity,
  deleteLocalIdentity,
  selectLocalIdentity,
  exportIdentity,
  importIdentity
} from "./gateway";
import { tauriIdentityRecoveryFileClient } from "./recovery-file";
import type { DaemonClient } from "../daemon/client";
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
describe("local identity helpers", () => {
  it("routes local identity creation, selection, and deletion through admin endpoints", async () => {
    const identities = {
      active_identity: "work.jolt",
      identities: [
        { address: "alice.jolt", label: "Default", active: false },
        { address: "work.jolt", label: "Work", active: true }
      ]
    };
    const client: DaemonClient = {
      daemonUrl: "http://127.0.0.1:9862",
      get: vi.fn(),
      post: vi
        .fn()
        .mockResolvedValueOnce({
          address: "work.jolt",
          label: "Work",
          active: false
        })
        .mockResolvedValueOnce(identities),
      delete: vi.fn().mockResolvedValueOnce({
        active_identity: "alice.jolt",
        identities: []
      })
    };

    await expect(createLocalIdentity(client, "Work")).resolves.toEqual({
      address: "work.jolt",
      label: "Work",
      active: false
    });
    await expect(selectLocalIdentity(client, "work.jolt")).resolves.toEqual(identities);
    await expect(deleteLocalIdentity(client, "work.jolt")).resolves.toEqual({
      active_identity: "alice.jolt",
      identities: []
    });

    expect(client.post).toHaveBeenNthCalledWith(1, "/admin/v1/identities", {
      label: "Work"
    });
    expect(client.post).toHaveBeenNthCalledWith(2, "/admin/v1/identities/active", {
      identity: "work.jolt"
    });
    expect(client.delete).toHaveBeenCalledWith("/admin/v1/identities/work.jolt");
  });
});

describe("identity recovery helpers", () => {
  it("routes identity export and import through admin-only recovery endpoints", async () => {
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
        .mockResolvedValueOnce({
          identity: "alice.jolt",
          encryption_key_count: 1,
          bundle
        })
        .mockResolvedValueOnce({
          identity: "alice.jolt",
          imported: true,
          restart_required: true,
          encryption_key_count: 1,
          app_sessions_imported: false
        })
    };

    await expect(exportIdentity(client, "", "Laptop", "work.jolt")).resolves.toEqual({
      identity: "alice.jolt",
      encryption_key_count: 1,
      bundle
    });
    await expect(importIdentity(client, bundle, "", true)).resolves.toEqual({
      identity: "alice.jolt",
      imported: true,
      restart_required: true,
      encryption_key_count: 1,
      app_sessions_imported: false
    });

    expect(client.post).toHaveBeenNthCalledWith(1, "/admin/v1/identities/export", {
      identity: "work.jolt",
      passphrase: null,
      label: "Laptop"
    });
    expect(client.post).toHaveBeenNthCalledWith(2, "/admin/v1/identities/import", {
      passphrase: null,
      bundle,
      allow_overwrite: true,
      as_local_identity: false
    });
  });
});
