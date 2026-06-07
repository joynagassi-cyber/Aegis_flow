import { Task, TaskStatus } from '../types';
import { createStore } from './simpleStore';

const createTaskId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

interface TaskState {
  tasks: Task[];
  addTask: (title: string, priority?: Task['priority'], category?: string) => void;
  updateTask: (id: string, changes: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  getTasksByStatus: () => Record<TaskStatus, Task[]>;
}

export const useTaskStore = createStore<TaskState>(
  (set, get) => ({
    tasks: [],
    addTask: (title, priority = 'medium', category) => {
      const now = Date.now();
      const newTask: Task = {
        id: createTaskId(),
        title,
        priority,
        category,
        status: 'todo',
        createdAt: now,
        updatedAt: now,
      };
      set(state => ({ tasks: [...state.tasks, newTask] }));
    },
    updateTask: (id, changes) => {
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === id ? { ...t, ...changes, updatedAt: Date.now() } : t,
        ),
      }));
    },
    deleteTask: id => {
      set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    },
    moveTask: (id, newStatus) => {
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === id ? { ...t, status: newStatus, updatedAt: Date.now() } : t,
        ),
      }));
    },
    getTasksByStatus: () => {
      const groups = { todo: [], in_progress: [], done: [] } as Record<TaskStatus, Task[]>;
      get().tasks.forEach(t => {
        groups[t.status].push(t);
      });
      return groups;
    },
  }),
  { storageKey: 'taskStore' },
);
