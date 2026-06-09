import { useState, useEffect, useCallback } from 'react';
import { FileText, FileJson, Table, FileType, Trash2, Copy, Check, Archive, Search, X, Globe, Hash, Layers } from 'lucide-react';
import { listArtifacts, deleteArtifact, getArtifactTypes, getArtifactSessions, searchArtifacts } from '../services/artifactService';
import type { ArtifactRecord, ArtifactTypeCount, ArtifactSession } from '../services/artifactService';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  html: { icon: Globe, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  json: { icon: FileJson, color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  csv: { icon: Table, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  markdown: { icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  pdf: { icon: FileType, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

function formatDate(d: string): string {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function ArtifactCard({ artifact, onDelete }: { artifact: ArtifactRecord; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[artifact.type] || TYPE_CONFIG.markdown;
  const Icon = config.icon;
  const preview = artifact.content.length > 200 ? artifact.content.slice(0, 200) + '...' : artifact.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-glass group overflow-hidden transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: config.bg }}>
            <Icon className="h-4 w-4" style={{ color: config.color }} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-[var(--text)]">{artifact.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>{artifact.type}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{formatDate(artifact.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={handleCopy} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
            {copied ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => onDelete(artifact.id)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400 transition">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="px-4 py-3">
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
          <pre className={`text-xs leading-6 text-[var(--text-muted)] font-mono whitespace-pre-wrap ${!expanded ? 'line-clamp-4' : ''}`}>
            {expanded ? artifact.content : preview}
          </pre>
        </button>
        {artifact.content.length > 200 && (
          <button onClick={() => setExpanded(!expanded)} className="mt-2 text-[10px] font-bold text-[var(--accent)] hover:underline">
            {expanded ? 'Réduire' : 'Voir plus'}
          </button>
        )}
      </div>
      {artifact.language && (
        <div className="border-t border-[var(--border)] px-4 py-2">
          <div className="flex items-center gap-1.5">
            <Hash className="h-3 w-3 text-[var(--text-muted)]" />
            <span className="text-[10px] text-[var(--text-muted)]">{artifact.language}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([]);
  const [typeCounts, setTypeCounts] = useState<ArtifactTypeCount[]>([]);
  const [sessions, setSessions] = useState<ArtifactSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterSession, setFilterSession] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [arts, types, sess] = await Promise.all([
      listArtifacts({ type: filterType || undefined, session_id: filterSession || undefined, limit: 100 }),
      getArtifactTypes(),
      getArtifactSessions(),
    ]);
    setArtifacts(arts);
    setTypeCounts(types);
    setSessions(sess);
    setLoading(false);
  }, [filterType, filterSession]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    await deleteArtifact(id);
    setArtifacts(prev => prev.filter(a => a.id !== id));
  };

  useEffect(() => {
    if (!searchQuery.trim()) { load(); return; }
    const t = setTimeout(async () => {
      const results = await searchArtifacts(searchQuery);
      if (results) setArtifacts(results);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filtered = artifacts;

  const totalCount = typeCounts.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Archive className="h-5 w-5 text-[var(--accent)]" />
          <h1 className="text-lg font-bold text-[var(--text)]">Artefacts</h1>
          <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-[10px] text-[var(--accent)] font-bold">
            {totalCount} total
          </span>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
          <Layers className="h-3.5 w-3.5" />
          Rafraîchir
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {typeCounts.map(tc => {
          const cfg = TYPE_CONFIG[tc.type] || TYPE_CONFIG.markdown;
          const Icon = cfg.icon;
          const isActive = filterType === tc.type;
          return (
            <button
              key={tc.type}
              onClick={() => setFilterType(isActive ? '' : tc.type)}
              className={`card-glass-small flex items-center gap-3 p-3 transition ${
                isActive ? 'ring-1' : ''
              }`}
              style={isActive ? { boxShadow: `0 0 0 1px ${cfg.color}` } : undefined}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: cfg.bg }}>
                <Icon className="h-4 w-4" style={{ color: cfg.color }} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text)] capitalize">{tc.type}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{tc.count} fichier{tc.count > 1 ? 's' : ''}</p>
              </div>
            </button>
          );
        })}
      </div>

      {sessions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sessions.map(s => {
            const isActive = filterSession === s.session_id;
            return (
              <button
                key={s.session_id}
                onClick={() => setFilterSession(isActive ? '' : s.session_id)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold transition ${
                  isActive
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
                }`}
              >
                {s.session_id === '' ? 'Sans session' : s.session_id.slice(0, 20)} · {s.count}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher dans les artefacts..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--accent)]/50"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-glass h-48 animate-pulse">
              <div className="h-full w-full bg-[var(--surface-2)] rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Archive className="h-16 w-16 text-[var(--surface-3)] mb-4" />
          <h3 className="text-lg font-bold text-[var(--text)]">Aucun artefact</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md">
            {filterType || filterSession
              ? 'Aucun résultat pour les filtres sélectionnés. Essaie de modifier tes filtres.'
              : 'Génère du code (HTML, JSON, CSV, Markdown) dans le chat IA pour le voir apparaître ici automatiquement.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <ArtifactCard key={a.id} artifact={a} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
