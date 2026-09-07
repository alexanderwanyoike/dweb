import type { AppSessionGrant } from "../daemon/types";
export type AppAccess = {
  id: string;
  name: string;
  active: AppSessionGrant[];
  history: AppSessionGrant[];
};
export function grantRecency(grant: AppSessionGrant) {
  return (
    grant.last_used_at ??
    grant.revoked_at ??
    grant.rejected_at ??
    grant.approved_at ??
    grant.created_at
  );
}
export function compareGrantRecency(a: AppSessionGrant, b: AppSessionGrant) {
  return grantRecency(b) - grantRecency(a);
}
export function groupApplications(sessions: AppSessionGrant[]): AppAccess[] {
  const groups = new Map<string, AppAccess>();
  for (const session of [...sessions].sort(compareGrantRecency)) {
    const app = groups.get(session.app_id) ?? {
      id: session.app_id,
      name: session.app_name,
      active: [],
      history: [],
    };
    (session.status === "active" ? app.active : app.history).push(session);
    groups.set(app.id, app);
  }
  return [...groups.values()].sort(
    (a, b) =>
      Number(b.active.length > 0) - Number(a.active.length > 0) ||
      a.name.localeCompare(b.name) ||
      a.id.localeCompare(b.id),
  );
}
export function identityFor(grant: AppSessionGrant) {
  return grant.identity ?? grant.requested_identity ?? "Unspecified identity";
}
export function identityGroups(sessions: AppSessionGrant[]) {
  const groups = new Map<string, AppSessionGrant[]>();
  for (const session of sessions) {
    const identity = identityFor(session).replace(/\.jolt$/, "");
    const group = groups.get(identity) ?? [];
    group.push(session);
    groups.set(identity, group);
  }
  return [...groups].map(([identity, sessions]) => ({ identity, sessions }));
}
export function olderSession(
  session: AppSessionGrant,
  now = Date.now() / 1000,
) {
  return now - (session.last_used_at ?? session.created_at) > 30 * 24 * 60 * 60;
}
export function exactGrants(sessions: AppSessionGrant[]) {
  return [
    ...new Set(sessions.flatMap((session) => session.granted_capabilities)),
  ].sort();
}
export function permissionsDiffer(sessions: AppSessionGrant[]) {
  return (
    new Set(
      sessions.map((session) =>
        JSON.stringify([...session.granted_capabilities].sort()),
      ),
    ).size > 1
  );
}
