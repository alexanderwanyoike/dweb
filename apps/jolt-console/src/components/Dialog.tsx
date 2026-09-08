import { useEffect, useId, useRef, type ReactNode } from "react";
export function Dialog({
  title,
  children,
  busy = false,
  onClose,
}: {
  title: string;
  children: ReactNode;
  busy?: boolean;
  onClose(): void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    dialog
      .querySelector<HTMLElement>(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
      )
      ?.focus();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="console-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button aria-label="Close dialog" disabled={busy} onClick={onClose}>
          ×
        </button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
