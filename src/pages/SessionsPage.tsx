import { useState, useEffect } from 'react';
import { MessageSquare, Clock, Trash2, ArrowRight } from 'lucide-react';
import { getApiBase } from '../services/apiConfig';

interface SessionRow {
  session_id: string;
  message_count: number;
  first_message: string;
  last_message: string;
  last_user_message: string | null;
}

interface SessionsPageProps {
  onOpenSession?: (sessionId: string) => void;
}

export function SessionsPage({ onOpenSession }: SessionsPageProps) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/chat/sessions`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: SessionRow[] = await res.json();
      setSessions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const handleDeleteSession = async (sessionId: string) => {
    // For now, just log — server-side delete can be added later
    console.log('Delete session:', sessionId);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const preview = (content: string | null) => {
    if (!content) return '(message vide)';
    return content.length > 80 ? content.slice(0, 80) + '…' : content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-[var(--danger)]">❌ {error}</p>
        <button onClick={loadSessions} className="btn-primary rounded-xl px-4 py-2 text-sm">
          Réessayer
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <MessageSquare className="h-12 w-12 text-[var(--surface-3)]" />
        <p className="text-sm text-[var(--text-muted)]">Aucune session de chat</p>
        <p className="text-xs text-[var(--text-muted)]">Utilise l'IA Chat ou l'Agent pour créer des sessions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text)]">Historique des sessions</h2>
        <span className="text-xs text-[var(--text-muted)]">{sessions.length} session{sessions.length > 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-2">
        {sessions.map(s => (
          <div
            key={s.session_id}
            className="card-glass flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4 transition hover:border-[var(--accent)]/30"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span className="text-xs font-mono text-[var(--text-muted)] truncate">
                  {s.session_id.slice(0, 24)}…
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[var(--text-muted)]">
                  {s.message_count} msg
                </span>
              </div>
              <p className="text-sm text-[var(--text)] truncate">{preview(s.last_user_message)}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3 text-[var(--text-muted)]" />
                <span className="text-[10px] text-[var(--text-muted)]">{formatDate(s.last_message)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenSession && (
                <button
                  onClick={() => onOpenSession(s.session_id)}
                  className="rounded-lg p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition"
                  title="Ouvrir cette session"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleDeleteSession(s.session_id)}
                className="rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
