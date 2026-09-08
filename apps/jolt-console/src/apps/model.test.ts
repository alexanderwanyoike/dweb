import { expect, it } from "vitest";
import { groupApplications, identityGroups, olderSession } from "./model";
import { grant } from "./fixtures.test-support";

it("groups by app id across identities and origins, never by the reported name", () => {
  const groups = groupApplications([
    grant("one"),
    grant("two", { identity: "bob.jolt", app_origin: "http://localhost:5179" }),
    grant("three", { app_id: "another.app", app_name: "Spoke" }),
    grant("old", { status: "revoked" }),
  ]);
  expect(groups).toHaveLength(2);
  const spoke = groups.find((app) => app.id === "spoke.local")!;
  expect(spoke.active).toHaveLength(2);
  expect(spoke.history).toHaveLength(1);
  expect(identityGroups(spoke.active)).toHaveLength(2);
});

it("keeps older authorised sessions in the active group", () => {
  const old = grant("old");
  expect(olderSession(old, 10_000_000)).toBe(true);
  expect(groupApplications([old])[0].active).toEqual([old]);
});
