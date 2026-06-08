import { PomodoroTimer } from '../components/PomodoroTimer';

interface PomodoroPageProps {
  techTasksCount: number;
}

export function PomodoroPage({ techTasksCount }: PomodoroPageProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <PomodoroTimer />
      <div className="card-glass space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
            Méthode
          </p>
          <h3 className="mt-2 font-syne text-xl font-bold">Deep Work Protocol</h3>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Session</p>
            <p className="mt-1 text-lg font-bold">25 min focus · 5 min pause</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Cycle long</p>
            <p className="mt-1 text-lg font-bold">4 pomodoros → 15 min pause</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Rythme cible</p>
            <p className="mt-1 text-lg font-bold">{Math.floor(techTasksCount * 4)} sessions/jour</p>
          </div>
        </div>
      </div>
    </section>
  );
}
