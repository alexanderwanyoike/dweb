import type { AppSessionGrant, LocalIdentitiesPayload } from "../daemon/types";
import { identityFor, olderSession } from "./model";
import { SessionDetails } from "./SessionDetails";

export function IdentitySessions({
  identity,
  sessions,
  identities,
  busy,
  onRevoke,
}: {
  identity: string;
  sessions: AppSessionGrant[];
  identities: LocalIdentitiesPayload;
  busy: boolean;
  onRevoke(session: AppSessionGrant): void;
}) {
  const local = identities.identities.find(
    (item) => item.address.replace(/\.jolt$/, "") === identity,
  );
  const older = sessions.filter((session) => olderSession(session));
  const recent = sessions.filter((session) => !olderSession(session));
  const renderSession = (session: AppSessionGrant) => (
    <SessionDetails
      key={session.session_id || session.request_id}
      session={session}
      busy={busy}
      onRevoke={(session) => onRevoke(session)}
    />
  );
  return (
    <section className="access-identity">
      <h4>{local?.label || identityFor(sessions[0])}</h4>
      {local?.label && (
        <p className="mono access-muted">{identityFor(sessions[0])}</p>
      )}
      {recent.map(renderSession)}
      {older.length > 0 && (
        <details className="access-history">
          <summary>Older authorised sessions ({older.length})</summary>
          <p>
            These sessions still have access. Last used more than 30 days ago,
            or never used since creation.
          </p>
          {older.map(renderSession)}
        </details>
      )}
    </section>
  );
}
