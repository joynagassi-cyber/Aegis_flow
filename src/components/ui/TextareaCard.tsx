import type { ChangeEvent } from 'react';

export function TextareaCard({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}) {
  return (
    <label className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <span className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{label}</span>
      <textarea
        value={value}
        onChange={onChange}
        rows={4}
        placeholder={placeholder}
        className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
      />
    </label>
  );
}
