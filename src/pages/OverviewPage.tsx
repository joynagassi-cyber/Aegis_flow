import { useMemo } from 'react';
import { Home, Rocket, Sparkles, Users, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { type ProgramState, type Book, getWorkoutQuota } from '../data/initialData';
import { StatsPanel, type StatCard } from '../components/StatsPanel';
import { DailyBriefCard } from '../components/DailyBriefCard';
import { CoachWidget } from '../components/CoachWidget';
import { formatNumber, toPercent } from '../utils/helpers';

interface OverviewPageProps {
  state: ProgramState;
  currentQuote: { text: string; author: string };
}

export function OverviewPage({ state, currentQuote: _currentQuote }: OverviewPageProps) {
  const finishedBooks = useMemo(
    () => state.books.filter((book: Book) => book.status === 'terminé').length,
    [state.books],
  );

  const disciplineScore = useMemo(() => {
    const current = state.currentDayInput;
    const checkpoints = [
      toPercent(current.prayerHours, 6),
      toPercent(current.bibleChapters, 40),
      toPercent(current.englishMinutes, 45),
      toPercent(current.techTasksCount, 3),
      toPercent(current.pitchConfidence, 10),
      toPercent(
        Object.values(current.sport).filter(Boolean).length +
          Object.values(current.menage.daily).filter(Boolean).length,
        16,
      ),
    ];

    return Math.round(
      checkpoints.reduce((sum, value) => sum + value, 0) / checkpoints.length,
    );
  }, [state.currentDayInput]);

  const recentDisciplineAvg = useMemo(() => {
    const recent = state.days.slice(0, 7);
    if (recent.length === 0) return 0;
    return Math.round(recent.reduce((sum, d) => sum + d.spiritual.score, 0) / recent.length);
  }, [state.days]);

  const mrrTrend = useMemo(() => {
    const recent = state.days.slice(0, 7);
    if (recent.length < 2) return 'stable' as const;
    const first = recent.slice(Math.floor(recent.length / 2));
    const second = recent.slice(0, Math.floor(recent.length / 2));
    const firstAvg = first.reduce((s, d) => s + d.tech.payingCustomersDelta, 0) / first.length;
    const secondAvg = second.reduce((s, d) => s + d.tech.payingCustomersDelta, 0) / second.length;
    if (secondAvg > firstAvg * 1.1) return 'up' as const;
    if (secondAvg < firstAvg * 0.9) return 'down' as const;
    return 'stable' as const;
  }, [state.days]);

  const statsCards: StatCard[] = [
    {
      label: 'Discipline',
      value: `${disciplineScore}%`,
      detail: 'Prière, lecture, sport et ménage',
      progress: disciplineScore,
      accent: '#0066FF',
    },
    {
      label: 'Clients payants',
      value: formatNumber(state.payingCustomers),
      detail: 'Base cumulée sur le parcours',
      progress: toPercent(state.payingCustomers, 100000),
      accent: '#00B4FF',
    },
    {
      label: 'MRR',
      value: `${formatNumber(state.mrr)}€`,
      detail: 'Revenu mensuel récurrent',
      progress: toPercent(state.mrr, 100000),
      accent: '#00E676',
    },
    {
      label: 'Livres terminés',
      value: `${finishedBooks}/350`,
      detail: 'Bibliothèque d\'élite',
      progress: toPercent(finishedBooks, 350),
      accent: '#FFD600',
    },
  ];

  return (
    <div className="space-y-6">
      <DailyBriefCard state={state} />

      <section className="card-glass space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[var(--accent)]/10 p-3 text-[var(--accent)]">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
              Progression
            </p>
            <h2 className="mt-1 font-syne text-2xl font-bold">Objectifs</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'MRR', value: `${formatNumber(state.mrr)}€`, target: '100 000€', progress: toPercent(state.mrr, 100000), color: '#00E676', trend: mrrTrend },
            { label: 'Clients', value: formatNumber(state.payingCustomers), target: '100 000', progress: toPercent(state.payingCustomers, 100000), color: '#00B4FF', trend: mrrTrend },
            { label: 'Features', value: formatNumber(state.featuresDelivered), target: '500', progress: toPercent(state.featuresDelivered, 500), color: '#0066FF', trend: mrrTrend },
            { label: 'Livres', value: `${finishedBooks}`, target: '350', progress: toPercent(finishedBooks, 350), color: '#FFD600', trend: mrrTrend },
          ].map(kpi => {
            const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
            const trendColor = kpi.trend === 'up' ? '#00E676' : kpi.trend === 'down' ? '#FF1744' : 'var(--text-muted)';
            return (
              <div key={kpi.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 transition hover:border-[var(--primary)]/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{kpi.label}</p>
                  <TrendIcon className="h-4 w-4" style={{ color: trendColor }} />
                </div>
                <p className="mt-3 font-syne text-3xl font-bold">{kpi.value}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Objectif: {kpi.target}</p>
                <div className="mt-4 h-2.5 rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${kpi.progress}%`, background: `linear-gradient(90deg, ${kpi.color}, ${kpi.color}dd)` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">Progression</span>
                  <span className="text-xs font-bold" style={{ color: kpi.color }}>{Math.round(kpi.progress)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Anglais', value: `${state.englishStreak}`, suffix: 'jours', score: Math.min(100, state.englishStreak * 5), color: '#00B4FF' },
            { label: 'Sport', value: `${state.sportStreak}`, suffix: 'jours', score: Math.min(100, state.sportStreak * 5), color: '#FFD600' },
            { label: 'Discipline moy.', value: `${recentDisciplineAvg}`, suffix: '%', score: recentDisciplineAvg, color: '#0066FF' },
          ].map(minor => (
            <div key={minor.label} className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl" style={{ background: `${minor.color}15` }}>
                <span className="font-syne text-lg font-bold" style={{ color: minor.color }}>{minor.score}%</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{minor.label}</p>
                <p className="font-syne text-xl font-bold">{minor.value} <span className="text-xs font-normal text-[var(--text-muted)]">{minor.suffix}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <StatsPanel
        title="Pilotage global"
        subtitle="Les KPI les plus visibles sont regroupés ici pour relier la discipline quotidienne aux deux piliers du dashboard."
        stats={statsCards}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="card-glass space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Socle
              </p>
              <h2 className="mt-1 font-syne text-2xl font-bold">Discipline quotidienne</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Prière</p>
              <p className="mt-2 font-syne text-3xl font-bold">
                {state.currentDayInput.prayerHours}h
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {toPercent(state.currentDayInput.prayerHours, 6).toFixed(0)}% du quota
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Bible</p>
              <p className="mt-2 font-syne text-3xl font-bold">
                {state.currentDayInput.bibleChapters} chap.
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {toPercent(state.currentDayInput.bibleChapters, 40).toFixed(0)}% du quota
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Anglais</p>
              <p className="mt-2 font-syne text-3xl font-bold">
                {state.currentDayInput.englishMinutes} min
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {toPercent(state.currentDayInput.englishMinutes, 45).toFixed(0)}% du quota
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Sport</p>
              <p className="mt-2 font-syne text-3xl font-bold">
                {state.currentDayInput.sport.pushups} pushups
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Quota actuel: {getWorkoutQuota(state.currentDay, 'pushups')}
              </p>
            </div>
          </div>
        </article>

        <article className="card-glass space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--success)]/10 p-3 text-[var(--success)]">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Piliers
              </p>
              <h2 className="mt-1 font-syne text-2xl font-bold">Spiritualité & SaaS</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Spiritualité</p>
                  <p className="mt-1 font-syne text-2xl font-bold">
                    {Math.round((state.currentDayInput.prayerHours / 6) * 100)}%
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-[var(--warning)]" />
              </div>
              <div className="mt-4 h-2 rounded-full bg-[var(--surface-3)]">
                <div
                  className="h-full rounded-full bg-[var(--warning)]"
                  style={{
                    width: `${toPercent(state.currentDayInput.prayerHours, 6)}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">SaaS</p>
                  <p className="mt-1 font-syne text-2xl font-bold">
                    {formatNumber(state.payingCustomers)} clients
                  </p>
                </div>
                <Users className="h-8 w-8 text-[var(--accent)]" />
              </div>
              <div className="mt-4 h-2 rounded-full bg-[var(--surface-3)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${toPercent(state.payingCustomers, 100000)}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  Anglais
                </p>
                <p className="mt-2 text-2xl font-bold">{state.englishStreak}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Jours consécutifs</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  Livres
                </p>
                <p className="mt-2 text-2xl font-bold">{finishedBooks}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Terminés</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  Features
                </p>
                <p className="mt-2 text-2xl font-bold">{state.featuresDelivered}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Livrées</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <CoachWidget state={state} />
    </div>
  );
}
