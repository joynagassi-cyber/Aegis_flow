import { useMemo, useState, type FormEvent } from 'react';
import { BookOpen, CalendarDays, PencilLine, Plus, Tag, Trash2 } from 'lucide-react';
import { useJournalStore } from '../store/journalStore';

export function Journal() {
  const { entries, addEntry, updateEntry, deleteEntry } = useJournalStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [entries],
  );

  const activeEntry = entries.find(entry => entry.id === editingId) ?? null;

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addEntry(
      title.trim(),
      content.trim(),
      tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    );

    setTitle('');
    setContent('');
    setTags('');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <form className="command-card space-y-4" onSubmit={handleCreate}>
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
            Journal
          </p>
          <h2 className="mt-2 font-syne text-2xl font-bold">Tracer l&#39;exécution</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Note les décisions, les blocages et les victoires. Le dashboard gagne en mémoire.
          </p>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Titre de l'entrée"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
          />
          <textarea
            value={content}
            onChange={event => setContent(event.target.value)}
            placeholder="Décris la décision, le contexte ou la leçon du jour"
            rows={7}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
          />
          <input
            value={tags}
            onChange={event => setTags(event.target.value)}
            placeholder="Tags séparés par des virgules"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          <Plus className="h-4 w-4" />
          Ajouter l&#39;entrée
        </button>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
            <span>Entrées</span>
            <span>{entries.length}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--text)]">
            Les notes récentes restent en haut pour faciliter la revue quotidienne.
          </p>
        </div>
      </form>

      <div className="space-y-4">
        {activeEntry && (
          <div className="command-card space-y-4 border-[var(--primary)]/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                  Mode édition
                </p>
                <h3 className="mt-1 font-syne text-xl font-bold">{activeEntry.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[var(--text-muted)] transition hover:text-[var(--text)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={activeEntry.content}
              onChange={event =>
                updateEntry(activeEntry.id, { content: event.target.value })
              }
              rows={6}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)]"
            />
            <div className="flex flex-wrap gap-2">
              {activeEntry.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)]"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {sortedEntries.length === 0 && (
            <div className="command-card flex min-h-[260px] items-center justify-center text-center">
              <div>
                <BookOpen className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
                <p className="mt-4 font-syne text-lg font-bold">Aucune entrée pour l’instant</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Capture les décisions importantes pour garder un historique exploitable.
                </p>
              </div>
            </div>
          )}

          {sortedEntries.map(entry => (
            <article
              key={entry.id}
              className="command-card space-y-4 transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(entry.updatedAt).toLocaleDateString('fr-FR')}
                  </div>
                  <h3 className="mt-2 font-syne text-xl font-bold">{entry.title}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(entry.id)}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[var(--text-muted)] transition hover:text-[var(--text)]"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[var(--text-muted)] transition hover:text-[var(--danger)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-muted)]">
                {entry.content}
              </p>

              <div className="flex flex-wrap gap-2">
                {entry.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)]"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
