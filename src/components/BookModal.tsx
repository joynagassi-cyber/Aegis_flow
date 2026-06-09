import { useState, useRef, type ChangeEvent } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import type { Book } from '../data/initialData';
import { insforge } from '../utils/insforge';

interface BookModalProps {
  book?: Book;
  onSave: (book: Book) => void;
  onClose: () => void;
}

const CATEGORIES: Book['category'][] = [
  'SIG', 'Télédétection', 'Urbanisme', 'Mindset', 'Développement personnel',
  'Culture générale', 'Prise de parole', 'Vente', 'Management',
  "Gestion d'entreprise", 'Création de startup', 'Littérature sociale', 'Tech', 'Spirituel'
];

const STATUSES: Book['status'][] = ['à lire', 'en cours', 'terminé'];

export function BookModal({ book, onSave, onClose }: BookModalProps) {
  const [title, setTitle] = useState(book?.title || '');
  const [author, setAuthor] = useState(book?.author || '');
  const [category, setCategory] = useState<Book['category']>(book?.category || 'Tech');
  const [status, setStatus] = useState<Book['status']>(book?.status || 'à lire');
  const [rating, setRating] = useState(book?.rating || 10);
  const [summary, setSummary] = useState(book?.summary || '');
  const [coverImage, setCoverImage] = useState(book?.coverImage || '');
  const [coverColor, setCoverColor] = useState(book?.coverColor || '#6366f1');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!insforge) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `book-covers/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await insforge.storage.from('media').upload(path, file);
      if (error) throw error;
      if (data?.url) setCoverImage(data.url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      id: book?.id || `book_${Date.now()}`,
      title: title.trim(),
      author: author.trim(),
      category,
      status,
      rating,
      summary: summary.trim(),
      keyPoints: book?.keyPoints || [],
      coverColor,
      coverImage: coverImage || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
          <X className="h-4 w-4" />
        </button>

        <h2 className="font-syne text-xl font-bold text-[var(--text)]">
          {book ? 'Modifier le livre' : 'Ajouter un livre'}
        </h2>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Titre</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" placeholder="Titre du livre" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Auteur</label>
              <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" placeholder="Nom de l'auteur" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Catégorie</label>
              <select value={category} onChange={e => setCategory(e.target.value as Book['category'])} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value as Book['status'])} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Note: {rating}/20
            </label>
            <input type="range" min="0" max="20" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Résumé</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] resize-none" placeholder="Résumé du livre..." />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Image de couverture</label>
            <div className="flex gap-3">
              <input value={coverImage} onChange={e => setCoverImage(e.target.value)} className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" placeholder="URL de la couverture" />
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} hidden />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-50">
                {uploading ? <ImageIcon className="h-4 w-4 animate-pulse" /> : <Upload className="h-4 w-4" />}
                Upload
              </button>
            </div>
            {coverImage && (
              <img src={coverImage} alt="" className="mt-2 h-20 w-14 rounded-lg object-cover border border-[var(--border)]" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Couleur:</label>
            <input type="color" value={coverColor} onChange={e => setCoverColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded-lg border border-[var(--border)]" />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={handleSubmit} disabled={!title.trim()} className="btn-primary flex-1">{book ? 'Enregistrer' : 'Ajouter'}</button>
        </div>
      </div>
    </div>
  );
}
