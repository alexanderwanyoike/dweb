import { useEffect, useRef, useState } from "react";
import { identityFor, type AppSessionGrant, type RevocationResult } from "./model";
import { PermissionList } from "./PermissionList";

export function RevokeDialog({
  name,
  sessions,
  revoke,
  onClose,
}: {
  name: string;
  sessions: AppSessionGrant[];
  revoke(sessions: AppSessionGrant[]): Promise<RevocationResult>;
  onClose(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<RevocationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const targets = result
        ? result.failed.map((failure) => failure.session)
        : sessions;
      const next = await revoke(targets);
      setResult({
        succeeded: [...(result?.succeeded || []), ...next.succeeded],
        failed: next.failed,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }
  const finished = result !== null && result.failed.length === 0;
  const actionLabel = result ? "Retry failed sessions" : "Revoke access";
  return (
    <dialog
      ref={dialog}
      className="access-dialog"
      aria-labelledby="revoke-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id="revoke-title">Revoke {name} access?</h2>
      <p>
        Remove access from these {sessions.length} sessions. Other sessions and
        apps keep their access.
      </p>
      <div className="access-dialog-scroll">
        {sessions.map((session) => (
          <details key={session.session_id || session.request_id}>
            <summary>
              {identityFor(session)}{" "}
              <span className="access-muted">
                {session.app_origin || "Origin not reported"}
              </span>
            </summary>
            <p className="mono">
              Session {session.session_id || "not reported"}
            </p>
            <PermissionList grants={session.granted_capabilities} />
          </details>
        ))}
      </div>
      {result && (
        <div role="status">
          <p>
            {result.succeeded.length} revoked. {result.failed.length} could not
            be confirmed.
          </p>
          {result.failed.map((failure) => (
            <p
              className="access-error"
              key={failure.session.session_id || failure.session.request_id}
            >
              {failure.session.app_origin || identityFor(failure.session)}:{" "}
              {failure.error}. Treat this session as still authorised.
            </p>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="access-error">
          {error}
        </p>
      )}
      <footer>
        <button disabled={busy} onClick={onClose}>
          {finished ? "Done" : "Cancel"}
        </button>
        {!finished && (
          <button
            className="access-danger"
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? "Revoking…" : actionLabel}
          </button>
        )}
      </footer>
    </dialog>
  );
}
