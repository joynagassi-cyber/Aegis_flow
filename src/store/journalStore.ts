import { createStore } from './simpleStore';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface JournalState {
  entries: JournalEntry[];
  addEntry: (title: string, content: string, tags?: string[]) => void;
  updateEntry: (
    id: string,
    changes: Partial<Pick<JournalEntry, 'title' | 'content' | 'tags'>>,
  ) => void;
  deleteEntry: (id: string) => void;
}

const nowIso = () => new Date().toISOString();

export const useJournalStore = createStore<JournalState>(
  set => ({
    entries: [],
    addEntry: (title, content, tags = []) =>
      set(state => {
        const timestamp = nowIso();
        const entry: JournalEntry = {
          id: crypto.randomUUID(),
          title,
          content,
          tags,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        return { entries: [entry, ...state.entries] };
      }),
    updateEntry: (id, changes) =>
      set(state => ({
        entries: state.entries.map(entry =>
          entry.id === id ? { ...entry, ...changes, updatedAt: nowIso() } : entry,
        ),
      })),
    deleteEntry: id =>
      set(state => ({
        entries: state.entries.filter(entry => entry.id !== id),
      })),
  }),
  { storageKey: 'journalStore' },
);
