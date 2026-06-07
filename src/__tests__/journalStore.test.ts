import { useJournalStore } from '../store/journalStore';

describe('JournalStore', () => {
  beforeEach(() => {
    // Reset store and clear localStorage before each test
    useJournalStore.setState({ entries: [] });
    localStorage.clear();
  });

  it('adds an entry', () => {
    useJournalStore.getState().addEntry('Titre', 'Contenu', ['tag1']);
    const entries = useJournalStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Titre');
    expect(entries[0].tags).toContain('tag1');
  });

  it('updates an entry', () => {
    const { addEntry, updateEntry } = useJournalStore.getState();
    addEntry('Old', 'Ancien contenu');
    const id = useJournalStore.getState().entries[0].id;
    updateEntry(id, { title: 'Nouveau', content: 'Nouveau contenu' });
    const entry = useJournalStore.getState().entries[0];
    expect(entry.title).toBe('Nouveau');
    expect(entry.content).toBe('Nouveau contenu');
  });

  it('deletes an entry', () => {
    const { addEntry, deleteEntry } = useJournalStore.getState();
    addEntry('À supprimer', 'Texte');
    const id = useJournalStore.getState().entries[0].id;
    deleteEntry(id);
    expect(useJournalStore.getState().entries).toHaveLength(0);
  });

  it('persists to localStorage', () => {
    useJournalStore.getState().addEntry('Persist', 'Données');
    const stored = JSON.parse(localStorage.getItem('journalStore') as string);
    expect(stored.state.entries).toHaveLength(1);
  });
});
