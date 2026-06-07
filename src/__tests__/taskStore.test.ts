import { useTaskStore } from '../store/taskStore';

describe('TaskStore', () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [] });
    localStorage.clear();
  });

  it('adds a task with defaults', () => {
    useTaskStore.getState().addTask('Test task');
    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test task');
    expect(tasks[0].status).toBe('todo');
    expect(tasks[0].priority).toBe('medium');
  });

  it('adds a task with custom priority and category', () => {
    useTaskStore.getState().addTask('Urgent task', 'urgent', 'tech');
    const task = useTaskStore.getState().tasks[0];
    expect(task.priority).toBe('urgent');
    expect(task.category).toBe('tech');
  });

  it('updates a task', () => {
    useTaskStore.getState().addTask('Old title');
    const id = useTaskStore.getState().tasks[0].id;
    useTaskStore.getState().updateTask(id, { title: 'New title' });
    expect(useTaskStore.getState().tasks[0].title).toBe('New title');
  });

  it('moves a task between statuses', () => {
    useTaskStore.getState().addTask('Move me');
    const id = useTaskStore.getState().tasks[0].id;
    useTaskStore.getState().moveTask(id, 'in_progress');
    expect(useTaskStore.getState().tasks[0].status).toBe('in_progress');
    useTaskStore.getState().moveTask(id, 'done');
    expect(useTaskStore.getState().tasks[0].status).toBe('done');
  });

  it('deletes a task', () => {
    useTaskStore.getState().addTask('Delete me');
    const id = useTaskStore.getState().tasks[0].id;
    useTaskStore.getState().deleteTask(id);
    expect(useTaskStore.getState().tasks).toHaveLength(0);
  });

  it('groups tasks by status', () => {
    useTaskStore.getState().addTask('Todo');
    useTaskStore.getState().addTask('In progress', 'medium');
    const id = useTaskStore.getState().tasks[1].id;
    useTaskStore.getState().moveTask(id, 'in_progress');
    const groups = useTaskStore.getState().getTasksByStatus();
    expect(groups.todo).toHaveLength(1);
    expect(groups.in_progress).toHaveLength(1);
    expect(groups.done).toHaveLength(0);
  });
});
