import { ArrowUpRight, Target } from 'lucide-react';

export interface StatCard {
  label: string;
  value: string;
  detail: string;
  progress: number;
  accent: string;
}

interface StatsPanelProps {
  title?: string;
  subtitle?: string;
  stats: StatCard[];
}

export function StatsPanel({
  title = 'Repères clés',
  subtitle = 'Les KPI les plus utiles pour piloter la journée sans surcharge.',
  stats,
}: StatsPanelProps) {
  return (
    <section className="command-card space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
            Stats
          </p>
          <h2 className="mt-2 font-syne text-2xl font-bold">{title}</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => {
          const progress = Math.max(0, Math.min(100, stat.progress));

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-syne text-3xl font-bold text-[var(--text)]">
                    {stat.value}
                  </p>
                </div>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: `${stat.accent}20`, color: stat.accent }}
                >
                  <Target className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-4 h-2 rounded-full bg-[var(--surface-3)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: stat.accent }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{stat.detail}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
