import { useState } from 'react';
import { Circle, Trash2, ChevronLeft, ChevronRight, Plus, Edit3 } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { Task } from '../types';
import { AddTaskModal } from './AddTaskModal';

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  urgent: '#FF1744',
  high: '#FF9100',
  medium: '#00B4FF',
  low: '#888888',
};

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
};

const STATUS_ORDER: Task['status'][] = ['todo', 'in_progress', 'done'];

export const KanbanBoard = () => {
  const { getTasksByStatus, updateTask, deleteTask, moveTask } = useTaskStore();
  const [modalOpen, setModalOpen] = useState(false);
  const columns = getTasksByStatus();

  const handleMove = (taskId: string, direction: 'right' | 'left') => {
    const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
    if (!task) return;
    const idx = STATUS_ORDER.indexOf(task.status);
    const newIdx = direction === 'right' ? idx + 1 : idx - 1;
    if (newIdx >= 0 && newIdx < STATUS_ORDER.length) moveTask(taskId, STATUS_ORDER[newIdx]);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STATUS_ORDER.map(col => (
          <div key={col} className="flex min-w-[280px] flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {STATUS_LABELS[col]}
              </h3>
              <span className="rounded-full bg-[var(--surface-3)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-muted)]">
                {columns[col].length}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {columns[col].map(task => (
                <div key={task.id} className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:border-[var(--primary)]/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Circle
                          className="h-3 w-3 shrink-0"
                          style={{ color: PRIORITY_COLORS[task.priority], fill: PRIORITY_COLORS[task.priority] }}
                        />
                        <p className="truncate text-sm font-bold">{task.title}</p>
                      </div>
                      {task.category && (
                        <p className="mt-1.5 text-xs text-[var(--text-muted)]">{task.category}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {col !== 'todo' && (
                        <button onClick={() => handleMove(task.id, 'left')} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]" title="Déplacer à gauche">
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {col !== 'done' && (
                        <button onClick={() => handleMove(task.id, 'right')} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]" title="Déplacer à droite">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const newTitle = prompt('Modifier le titre', task.title);
                          if (newTitle) updateTask(task.id, { title: newTitle });
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--warning)] hover:text-[var(--warning)]"
                        title="Modifier"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]" title="Supprimer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {col === 'todo' && (
              <button onClick={() => setModalOpen(true)} className="btn-secondary mt-4 w-full justify-center">
                <Plus className="h-4 w-4" />
                Nouvelle tâche
              </button>
            )}
          </div>
        ))}
      </div>

      <AddTaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
