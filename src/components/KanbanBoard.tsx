import { useTaskStore } from '../store/taskStore';
import { Task } from '../types';

export const KanbanBoard = () => {
  const { getTasksByStatus, addTask, updateTask, deleteTask, moveTask } =
    useTaskStore();

  const columns = getTasksByStatus();

  const handleAdd = () => {
    const title = prompt('Titre de la tâche ?');
    if (title) addTask(title);
  };

  const handleMove = (taskId: string, direction: 'right' | 'left') => {
    const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
    if (!task) return;
    const order: Task['status'][] = ['todo', 'in_progress', 'done'];
    const idx = order.indexOf(task.status);
    const newIdx = direction === 'right' ? idx + 1 : idx - 1;
    if (newIdx >= 0 && newIdx < order.length) moveTask(taskId, order[newIdx]);
  };

  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {(['todo', 'in_progress', 'done'] as const).map(col => (
        <div
          key={col}
          className="flex-1 min-w-[280px] bg-[var(--surface-2)] rounded-xl p-4"
        >
          <h2 className="text-lg font-bold mb-4 capitalize">{col}</h2>
          {columns[col].map(task => (
            <div
              key={task.id}
              className="bg-[var(--surface)] p-3 rounded-md mb-3 shadow-sm border border-[var(--border)]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{task.title}</p>
                  {task.priority && (
                    <span className="text-xs text-[var(--text-muted)]">
                      Priorité : {task.priority}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {col !== 'todo' && (
                    <button
                      onClick={() => handleMove(task.id, 'left')}
                      className="p-1 text-sm text-[var(--primary)]"
                      title="Déplacer à gauche"
                    >
                      ←
                    </button>
                  )}
                  {col !== 'done' && (
                    <button
                      onClick={() => handleMove(task.id, 'right')}
                      className="p-1 text-sm text-[var(--primary)]"
                      title="Déplacer à droite"
                    >
                      →
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const newTitle = prompt('Modifier le titre', task.title);
                      if (newTitle) updateTask(task.id, { title: newTitle });
                    }}
                    className="p-1 text-sm text-[var(--text-muted)]"
                    title="Modifier"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-sm text-red-500"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          {col === 'todo' && (
            <button
              onClick={handleAdd}
              className="mt-2 w-full py-2 bg-[var(--primary)] text-white rounded-md"
            >
              + Ajouter une tâche
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
