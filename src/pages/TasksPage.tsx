import { KanbanBoard } from '../components/KanbanBoard';

interface TasksPageProps {
  activeTasks: number;
}

export function TasksPage({ activeTasks }: TasksPageProps) {
  return (
    <section className="card-glass space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
            Exécution
          </p>
          <h2 className="mt-2 font-syne text-2xl font-bold">Kanban opérationnel</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            La colonne de travail est alignée sur le statut `in_progress`.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
            Tâches actives
          </p>
          <p className="mt-1 text-2xl font-bold">{activeTasks}</p>
        </div>
      </div>
      <KanbanBoard />
    </section>
  );
}
