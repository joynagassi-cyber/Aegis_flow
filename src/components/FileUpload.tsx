import { useRef, useState } from 'react';
import { Image, FileText, File as FilePdf } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => onFileSelect(f));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => onFileSelect(f));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition ${
          dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.md,.txt,.csv,.json,.html,.js,.ts,.py,.css,.pdf"
          multiple
          className="hidden"
          onChange={handleChange}
        />
        <p className="text-[11px] font-bold text-[var(--text-muted)]">Clique ou glisse des fichiers</p>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">Images · Markdown · PDF · Code</p>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <Image className="h-3 w-3" /> PNG, JPG, GIF, WebP (vision)
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <FileText className="h-3 w-3" /> MD, TXT, CSV, JSON, code
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <FilePdf className="h-3 w-3" /> PDF (texte extrait)
        </div>
      </div>
    </div>
  );
}
