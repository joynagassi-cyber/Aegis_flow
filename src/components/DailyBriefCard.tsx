import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw, Quote, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { generateBrief } from '../services/insightService';
import type { DailyBrief } from '../services/insightService';
import type { ProgramState } from '../data/initialData';

interface DailyBriefCardProps {
  state: ProgramState;
}

export function DailyBriefCard({ state }: DailyBriefCardProps) {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchBrief = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await generateBrief(state);
      if (result) {
        setBrief(result);
        localStorage.setItem('last_brief', JSON.stringify(result));
        setError(false);
      } else {
        const cached = localStorage.getItem('last_brief');
        if (cached) setBrief(JSON.parse(cached));
        else setError(true);
      }
    } catch {
      const cached = localStorage.getItem('last_brief');
      if (cached) setBrief(JSON.parse(cached));
      else setError(true);
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    const cached = localStorage.getItem('last_brief');
    if (cached) {
      const parsed = JSON.parse(cached) as DailyBrief;
      const isToday = new Date(parsed.date).toDateString() === new Date().toDateString();
      if (isToday && parsed.day === state.currentDay) {
        setBrief(parsed);
        return;
      }
    }
    fetchBrief();
  }, [state.currentDay, fetchBrief]);

  if (loading && !brief) {
    return (
      <div className="card-glass">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-xl bg-[var(--accent)]/20" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 animate-pulse rounded bg-[var(--surface-3)]" />
            <div className="h-3 w-64 animate-pulse rounded bg-[var(--surface-3)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-[var(--accent)]/10 p-2">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Briefing IA</p>
              <h2 className="font-syne text-sm font-bold text-[var(--text)]">Jour J{state.currentDay} — {state.currentSaaSPhase}</h2>
            </div>
            {loading && (
              <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                <span className="text-[10px] text-[var(--accent)]">Génération...</span>
              </span>
            )}
          </div>

          {error && !brief ? (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--danger)]/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-[var(--danger)]" />
              <p className="text-sm text-[var(--danger)]">Configure une clé API IA dans Réglages pour activer le briefing personnalisé.</p>
            </div>
          ) : brief ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <TrendingUp className="h-3 w-3" /> Tendance
                </div>
                <p className="mt-1 text-sm leading-5 text-[var(--text)]">{brief.trend}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <AlertCircle className="h-3 w-3" /> Priorités
                </div>
                <p className="mt-1 text-sm leading-5 text-[var(--text)]">{brief.urgentTasks}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <Target className="h-3 w-3" /> Objectif du jour
                </div>
                <p className="mt-1 text-sm leading-5 text-[var(--text)]">{brief.dailyGoal}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <Quote className="h-3 w-3" /> Citation
                </div>
                <p className="mt-1 text-sm italic leading-5 text-[var(--text-muted)]">"{brief.quote}"</p>
              </div>
            </div>
          ) : null}
        </div>

        <button
          onClick={fetchBrief}
          disabled={loading}
          className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-[var(--text-muted)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition disabled:opacity-50"
          title="Régénérer le briefing"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
