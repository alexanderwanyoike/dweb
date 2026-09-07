import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { TaskSection, TaskRow } from "../components/TaskSection";
import type { ConsoleUpdates } from "../update/use-console-updates";
import { updateTitle, updateSummary } from "./update-presentation";
export function UpdateSettings({ updates }: { updates: ConsoleUpdates }) {
  const [review, setReview] = useState(false);
  const { check, busy, error } = updates;
  async function install() {
    if (await updates.install()) setReview(false);
  }
  return (
    <TaskSection title="Updates">
      <TaskRow title={updateTitle(updates)} description={updateSummary(check)}>
        <button disabled={busy} onClick={() => void updates.refresh()}>
          Check for updates
        </button>
      </TaskRow>
      {check?.available && (
        <>
          <p className="task-help">
            {check.currentVersion} -&gt; {check.version}
          </p>
          {check.date && <p className="task-help">Published {check.date}</p>}
          {check.notes && <p className="release-notes">{check.notes}</p>}
        </>
      )}
      {error && !review && <p role="alert">Console update error: {error}</p>}
      <div className="node-actions">
        <button
          className="task-primary"
          disabled={busy || !check?.available}
          onClick={() => setReview(true)}
        >
          Install and restart
        </button>
      </div>
      {review && (
        <Dialog
          title="Install this update?"
          busy={busy}
          onClose={() => setReview(false)}
        >
          <p>
            Console will install the signed update and relaunch. A node owned by
            Console will stop first. Externally managed nodes keep running.
          </p>
          {check?.available && (
            <p>
              Version {check.currentVersion} → {check.version}
            </p>
          )}
          {error && <p role="alert">{error}</p>}
          <div className="node-actions">
            <button disabled={busy} onClick={() => setReview(false)}>
              Cancel
            </button>
            <button disabled={busy} onClick={() => void install()}>
              Confirm installation
            </button>
          </div>
        </Dialog>
      )}
    </TaskSection>
  );
}
