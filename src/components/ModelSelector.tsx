import { useState, useRef, useEffect } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

interface ModelSelectorProps {
  provider: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ModelOption {
  id: string;
  name: string;
}

const API_ROUTES: Record<string, { url: string | ((key: string) => string); parser: (data: any) => ModelOption[] }> = {
  GEMINI: {
    url: (key: string) => `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    parser: (data) => (data.models || [])
      .filter((m: any) => m.name.includes('gemini') && !m.name.includes('tuning'))
      .map((m: any) => ({ id: m.name.replace('models/', ''), name: m.displayName || m.name })),
  },
  OPENROUTER: {
    url: () => 'https://openrouter.ai/api/v1/models',
    parser: (data) => (data.data || []).map((m: any) => ({ id: m.id, name: m.name || m.id })),
  },
  FIREWORKS: {
    url: (key: string) => 'https://api.fireworks.ai/inference/v1/models',
    parser: (data) => (data.data || []).map((m: any) => ({ id: m.id, name: m.id.split('/').pop() || m.id })),
  },
  DEEPSEEK: {
    url: () => 'https://api.deepseek.com/models',
    parser: (data) => (data.data || []).map((m: any) => ({
      id: m.id,
      name: `${m.id}${m.id === 'deepseek-chat' ? ' (sera déprécié 2026-07-24)' : m.id === 'deepseek-reasoner' ? ' (sera déprécié 2026-07-24)' : ''}`,
    })),
  },
};

export function ModelSelector({ provider, value, onChange, placeholder }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const route = API_ROUTES[provider];
  if (!route) return null;

  const fetchModels = async () => {
    setLoading(true);
    setError('');
    try {
      const apiKey = localStorage.getItem(`API_KEY_${provider}`) || '';
      const url = typeof route.url === 'function' ? route.url(apiKey) : route.url;
      const res = await fetch(url, apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : undefined);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = route.parser(data);
      setModels(list);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const filtered = search ? models.filter(m => m.id.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase())) : models;

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => { onChange(e.target.value); setSearch(''); }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
        />
        <button
          type="button"
          onClick={fetchModels}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50"
          title="Charger les modèles"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Modèles
        </button>
      </div>

      {open && models.length > 0 && (
        <div className="absolute left-0 right-14 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          <div className="sticky top-0 border-b border-[var(--border)] bg-[var(--surface)] p-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs outline-none"
              autoFocus
            />
          </div>
          {filtered.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onChange(m.id); setOpen(false); setSearch(''); }}
              className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-[var(--surface-2)] ${value === m.id ? 'text-[var(--primary)] font-bold' : 'text-[var(--text)]'}`}
            >
              <span className="block text-xs text-[var(--text-muted)]">{m.name}</span>
              <span className="block font-mono-num text-[11px] text-[var(--text-subtle)]">{m.id}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-3 text-xs text-[var(--text-muted)]">Aucun modèle trouvé</p>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
