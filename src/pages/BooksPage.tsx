import { BookOpen } from 'lucide-react';
import { type Book, type ProgramState, RECOMMENDED_BOOKS } from '../data/initialData';
import { BookCard } from '../components/BookCard';

interface BooksPageProps {
  state: ProgramState;
  onAddBook: (book: Book) => void;
  onToggleSort: () => void;
}

export function BooksPage({ state, onAddBook, onToggleSort }: BooksPageProps) {
  const finishedBooks = state.books.filter(book => book.status === 'terminé').length;

  return (
    <section className="space-y-6">
      <div className="card-glass flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
            Bibliothèque
          </p>
          <h2 className="mt-2 font-syne text-2xl font-bold">Livres utiles au plan</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Les recommandations sont prêtes à être ajoutées à ta bibliothèque personnelle.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="card-glass-small card-glass">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Terminés</p>
            <p className="mt-1 text-xl font-bold">{finishedBooks}</p>
          </div>
          <div className="card-glass-small card-glass">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Recommandés</p>
            <p className="mt-1 text-xl font-bold">{RECOMMENDED_BOOKS.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {RECOMMENDED_BOOKS.slice(0, 12).map(book => (
          <BookCard key={book.id} book={book} onAction={onAddBook} />
        ))}
      </div>

      <div className="card-glass space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
              Bibliothèque personnelle
            </p>
            <h3 className="mt-2 font-syne text-xl font-bold">{state.books.length} entrées</h3>
          </div>
          <button type="button" onClick={onToggleSort} className="btn-secondary">
            Trier
          </button>
        </div>
        {state.books.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Aucun livre personnel pour l'instant. Ajoute une recommandation pour commencer.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {state.books.map(book => (
              <BookCard key={book.id} book={book} inLibrary onAction={onAddBook} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
