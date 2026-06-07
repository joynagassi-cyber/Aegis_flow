export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  dueDate?: string;
}
