export function ToggleCard({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-2xl border p-4 text-left transition ${
        checked
          ? 'border-[var(--success)] bg-[var(--success)]/10'
          : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-sm font-bold">{checked ? 'Activé' : 'Désactivé'}</p>
        </div>
        <span
          className={`h-4 w-4 rounded-full ${
            checked ? 'bg-[var(--success)]' : 'bg-[var(--text-subtle)]'
          }`}
        />
      </div>
    </button>
  );
}
