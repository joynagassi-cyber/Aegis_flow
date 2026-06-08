import {} from 'react';

export function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <span className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={event => onChange(Number(event.target.value))}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-lg font-bold outline-none transition focus:border-[var(--primary)]"
        />
        {suffix && <span className="text-xs text-[var(--text-muted)]">{suffix}</span>}
      </div>
    </label>
  );
}
