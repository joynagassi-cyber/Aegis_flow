import { useRef, useState } from 'react';
import { Camera, Trash2, Cloud, CheckCircle2 } from 'lucide-react';
import { insforge } from '../utils/insforge';

interface PhotoUploadProps {
  currentPhoto: string;
  onPhotoChange: (dataUrl: string, key: string) => void;
}

const PHOTO_CACHE_KEY = 'profile-photo-cache';
const PHOTO_URL_KEY = 'profile-photo-url';

function getCachedPhoto(): string | null {
  try {
    return localStorage.getItem(PHOTO_CACHE_KEY);
  } catch { return null; }
}

function getStoredUrl(): string | null {
  try {
    return localStorage.getItem(PHOTO_URL_KEY);
  } catch { return null; }
}

function setCached(dataUrl: string, url?: string) {
  try { localStorage.setItem(PHOTO_CACHE_KEY, dataUrl); } catch { /* ignore */ }
  if (url) { try { localStorage.setItem(PHOTO_URL_KEY, url); } catch { /* ignore */ } }
}

function clearCached() {
  try { localStorage.removeItem(PHOTO_CACHE_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem(PHOTO_URL_KEY); } catch { /* ignore */ }
}

async function uploadToInsForge(file: File): Promise<{ url: string; key: string } | null> {
  if (!insforge) return null;

  const fileName = `u_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const { data, error } = await insforge.storage
    .from('profile-photos')
    .upload(fileName, file);

  if (error || !data) {
    console.warn('InsForge upload failed:', error?.message);
    return null;
  }

  return { url: data.url, key: data.key };
}

export function PhotoUpload({ currentPhoto, onPhotoChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'uploading' | 'done' | 'offline'>('idle');

  const cached = getCachedPhoto();
  const storedUrl = getStoredUrl();
  const displaySrc = preview || cached || storedUrl || currentPhoto;

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setCached(dataUrl);

      const localKey = `profile_${Date.now()}_${file.name}`;

      if (insforge) {
        setCloudStatus('uploading');
        const result = await uploadToInsForge(file);
        if (result) {
          setCloudStatus('done');
          setCached(dataUrl, result.url);
          onPhotoChange(result.url, result.key);
        } else {
          setCloudStatus('offline');
          setCached(dataUrl);
          onPhotoChange(dataUrl, localKey);
        }
      } else {
        setCached(dataUrl);
        onPhotoChange(dataUrl, localKey);
      }

      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setCloudStatus('idle');
    clearCached();
    onPhotoChange('', '');
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className="group relative mx-auto flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-[28px] border-2 border-dashed border-[var(--border)] bg-[var(--surface-2)] transition-all hover:border-[var(--primary)]"
        onClick={() => inputRef.current?.click()}
      >
        {displaySrc ? (
          <>
            <img src={displaySrc} alt="Photo" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </>
        ) : (
          <Camera className="h-8 w-8 text-[var(--text-muted)]" />
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {displaySrc && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); handleRemove(); }}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--danger)]/30 bg-[var(--surface)] text-[var(--danger)] opacity-0 shadow-lg transition-all hover:bg-[var(--danger)] hover:text-white group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-black/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {cloudStatus === 'uploading' && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--accent)]">
          <Cloud className="h-3 w-3 animate-pulse" /> Sauvegarde cloud...
        </div>
      )}
      {cloudStatus === 'done' && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--success)]">
          <CheckCircle2 className="h-3 w-3" /> Synchronisé
        </div>
      )}
      {cloudStatus === 'offline' && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--warning)]">
          <Cloud className="h-3 w-3" /> Non synchronisé (local)
        </div>
      )}
    </div>
  );
}
