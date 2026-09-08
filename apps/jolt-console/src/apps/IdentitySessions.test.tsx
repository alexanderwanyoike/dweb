import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { IdentitySessions } from "./IdentitySessions";
import { grant } from "./fixtures.test-support";

afterEach(cleanup);

it("labels an identity and keeps old sessions authorised and individually revocable", async () => {
  const session = grant("old");
  const revoke = vi.fn();
  render(
    <IdentitySessions
      identity="alice"
      sessions={[session]}
      identities={{
        active_identity: null,
        identities: [{ address: "alice.jolt", label: "Personal", active: false }]
      }}
      busy={false}
      onRevoke={revoke}
    />
  );
  expect(screen.getByRole("heading", { name: "Personal" })).toBeVisible();
  await userEvent.click(screen.getByText("Older authorised sessions (1)"));
  expect(screen.getByText(/These sessions still have access/)).toBeVisible();
  await userEvent.click(screen.getByText("active"));
  await userEvent.click(screen.getByRole("button", { name: "Revoke this session" }));
  expect(revoke).toHaveBeenCalledExactlyOnceWith(session);
});
