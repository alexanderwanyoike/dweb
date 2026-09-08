import { Dialog } from "./Dialog";
export function ObjectDetails({
  title,
  fields,
  onClose
}: {
  title: string;
  fields: Record<string, string | number | boolean | null | undefined>;
  onClose(): void;
}) {
  return (
    <Dialog title={title} onClose={onClose}>
      <dl className="object-details">
        {Object.entries(fields).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value == null ? "Not reported" : String(value)}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
