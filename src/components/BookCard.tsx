import { useState } from 'react';
import { BookOpen, Star, Plus, Eye } from 'lucide-react';
import type { Book } from '../data/initialData';

interface BookCardProps {
  book: Book;
  inLibrary?: boolean;
  onAction?: (book: Book) => void;
}

export function BookCard({ book, inLibrary, onAction }: BookCardProps) {
  const [imgError, setImgError] = useState(false);

  const stars = Math.round(book.rating / 2);
  const hasCover = book.coverImage && !imgError;

  return (
    <article
      className="card-glass card-stagger group flex flex-col overflow-hidden"
      style={{ padding: 0 }}
    >
      <div
        className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--surface-3)]"
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
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-white/80">
            <BookOpen className="h-12 w-12" />
            <span className="text-center text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
              {book.category}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
          {onAction && (
            <button
              onClick={() => onAction(book)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white transition hover:bg-white/30 hover:scale-110"
              title={inLibrary ? 'Voir détails' : 'Ajouter à la bibliothèque'}
            >
              {inLibrary ? <Eye className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-bold">
          {book.category}
        </span>

        <h3 className="font-syne text-base font-bold leading-tight text-[var(--text)]">
          {book.title}
        </h3>

        <p className="text-xs text-[var(--text-muted)]">{book.author}</p>

        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < stars ? 'fill-[var(--warning)] text-[var(--warning)]' : 'text-[var(--surface-3)]'}`}
            />
          ))}
        </div>

        <p className="mt-auto text-[11px] leading-5 text-[var(--text-muted)] line-clamp-2">
          {book.summary}
        </p>

        {inLibrary && (
          <span
            className="self-start rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: `${book.coverColor}20`,
              color: book.coverColor,
              border: `1px solid ${book.coverColor}40`,
            }}
          >
            {book.status}
          </span>
        )}
      </div>
    </article>
  );
}
