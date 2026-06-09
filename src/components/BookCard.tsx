import { useState } from 'react';
import { BookOpen, Star, Plus, Pencil } from 'lucide-react';
import type { Book } from '../data/initialData';

interface BookCardProps {
  book: Book;
  inLibrary?: boolean;
  onAction?: (book: Book) => void;
  onEdit?: (book: Book) => void;
}

export function BookCard({ book, inLibrary, onAction, onEdit }: BookCardProps) {
  const [imgError, setImgError] = useState(false);

  const stars = Math.round(book.rating / 2);
  const hasCover = book.coverImage && !imgError;

  return (
    <article
      className="card-glass card-stagger group flex overflow-hidden"
      style={{ padding: 0 }}
    >
      <div
        className="relative h-32 w-[85px] shrink-0 overflow-hidden bg-[var(--surface-3)]"
        style={!hasCover ? { background: book.coverColor } : undefined}
      >
        {hasCover ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-white/80">
            <BookOpen className="h-6 w-6" />
            <span className="text-center text-[8px] font-bold uppercase tracking-[0.15em] opacity-70 leading-tight">
              {book.category}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-syne text-sm font-bold leading-tight text-[var(--text)] truncate">
              {book.title}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{book.author}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {inLibrary && onEdit && (
              <button onClick={() => onEdit(book)} className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)] transition" title="Modifier">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onAction && !inLibrary && (
              <button onClick={() => onAction(book)} className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)] transition" title="Ajouter à la bibliothèque">
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-2.5 w-2.5 ${i < stars ? 'fill-[var(--warning)] text-[var(--warning)]' : 'text-[var(--surface-3)]'}`} />
            ))}
          </div>
          {inLibrary && (
            <span className="rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em]"
              style={{ background: `${book.coverColor}20`, color: book.coverColor, border: `1px solid ${book.coverColor}40` }}>
              {book.status}
            </span>
          )}
        </div>

        <p className="text-[11px] leading-4 text-[var(--text-muted)] line-clamp-1">{book.summary}</p>
      </div>
    </article>
  );
}
