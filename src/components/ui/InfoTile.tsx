import type { ElementType } from 'react';

export function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ElementType;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-[var(--primary)]" />
      </div>
    </div>
  );
}
