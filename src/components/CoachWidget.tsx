import { useState, useEffect, useCallback } from 'react';
import { Brain, Lightbulb, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { generateCoachInsight } from '../services/insightService';
import type { CoachInsight } from '../services/insightService';
import type { ProgramState } from '../data/initialData';

interface CoachWidgetProps {
  state: ProgramState;
}

export function CoachWidget({ state }: CoachWidgetProps) {
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateCoachInsight(state);
      if (result) setInsight(result);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    fetchInsight();
  }, [state.currentDay, fetchInsight]);

  const severityColors = {
    positive: { bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.2)', text: 'text-[var(--success)]', icon: TrendingUp },
    warning: { bg: 'rgba(255,214,0,0.1)', border: 'rgba(255,214,0,0.2)', text: 'text-[var(--warning)]', icon: Minus },
    critical: { bg: 'rgba(255,23,68,0.1)', border: 'rgba(255,23,68,0.2)', text: 'text-[var(--danger)]', icon: TrendingDown },
  };

  const colors = insight ? severityColors[insight.severity] : severityColors.positive;
  const Icon = colors.icon;

  return (
    <div className="card-glass" style={{ background: colors.bg, borderColor: colors.border }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2" style={{ background: `${colors.bg}` }}>
            <Brain className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Coach IA</p>
            <h3 className="font-syne text-sm font-bold text-[var(--text)]">Insight personnalisé</h3>
          </div>
          {loading && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
          )}
        </div>
        <button
          onClick={fetchInsight}
          disabled={loading}
          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {insight ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-start gap-2 rounded-xl bg-[var(--surface-2)]/50 p-3">
            <Lightbulb className={`mt-0.5 h-4 w-4 shrink-0 ${colors.text}`} />
            <p className="text-sm leading-6 text-[var(--text)]">{insight.insight}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: colors.bg }}>
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-bold" style={{ color: colors.icon === TrendingUp ? '#00E676' : colors.icon === TrendingDown ? '#FF1744' : '#FFD600' }}>
                {insight.severity === 'positive' ? 'Positif' : insight.severity === 'warning' ? 'Attention' : 'Critique'}
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Corrélation: {(insight.correlation * 100).toFixed(0)}%
            </span>
          </div>
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Action recommandée</p>
            <p className="mt-1 text-sm font-bold text-[var(--accent)]">{insight.suggestion}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-12 animate-pulse rounded-xl bg-[var(--surface-3)]" />
          <div className="h-12 animate-pulse rounded-xl bg-[var(--surface-3)]" />
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-muted)]">Configure une clé API IA pour recevoir des insights personnalisés.</p>
      )}
    </div>
  );
}
