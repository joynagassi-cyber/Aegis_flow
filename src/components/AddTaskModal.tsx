import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Task } from '../types';
import { useTaskStore } from '../store/taskStore';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
}

const PRIORITIES: { value: Task['priority']; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#FF1744' },
  { value: 'high', label: 'Haute', color: '#FF9100' },
  { value: 'medium', label: 'Moyenne', color: '#00B4FF' },
  { value: 'low', label: 'Basse', color: '#888888' },
];

export function AddTaskModal({ open, onClose }: AddTaskModalProps) {
  const { addTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    addTask(title.trim(), priority, category.trim() || undefined);
    setTitle('');
    setPriority('medium');
    setCategory('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-syne text-xl font-bold">Nouvelle tâche</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de la tâche"
            autoFocus
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--primary)]"
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          />

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Priorité</p>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
                    priority === p.value
                      ? 'border-transparent text-white'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                  style={priority === p.value ? { background: p.color } : undefined}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Catégorie (optionnelle)"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--primary)]"
          />

          <button onClick={handleSubmit} disabled={!title.trim()} className="btn-primary w-full justify-center">
            <Plus className="h-4 w-4" />
            Ajouter la tâche
          </button>
        </div>
      </div>
    </div>
  );
}
