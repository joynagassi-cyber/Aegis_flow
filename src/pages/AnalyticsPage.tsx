import { useMemo } from 'react';
import { BarChart3, PieChart, Activity } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart as RePieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { DayData } from '../data/initialData';
import { StatsPanel, type StatCard } from '../components/StatsPanel';
import { PredictiveCard } from '../components/PredictiveCard';
import { calculateProductivityCorrelation } from '../utils/stats';

interface AnalyticsPageProps {
  statsCards: StatCard[];
  chartData: Array<{ day: string; spiritual: number; english: number; customers: number }>;
  days: DayData[];
}

export function AnalyticsPage({ statsCards, chartData, days }: AnalyticsPageProps) {
  const weeklyData = useMemo(() => {
    const weeks: Record<string, { week: string; tasks: number; pitches: number; courses: number; count: number }> = {};
    for (const day of days) {
      const weekKey = `S${Math.ceil(day.dayNumber / 7)}`;
      if (!weeks[weekKey]) weeks[weekKey] = { week: weekKey, tasks: 0, pitches: 0, courses: 0, count: 0 };
      weeks[weekKey].tasks += day.tech.tasksCompleted;
      weeks[weekKey].pitches += day.pitch.pitchesDone;
      weeks[weekKey].courses += day.marketing.coursesCompleted;
      weeks[weekKey].count++;
    }
    return Object.values(weeks).slice(-8);
  }, [days]);

  const disciplinePie = useMemo(() => {
    if (days.length === 0) return [];
    const latest = days[0];
    return [
      { name: 'Prière', value: latest.spiritual.prayerHours * 10, color: '#0066FF' },
      { name: 'Bible', value: latest.spiritual.bibleChapters * 2.5, color: '#00B4FF' },
      { name: 'Sport', value: Object.values(latest.sport).filter(Boolean).length * 10, color: '#00E676' },
      { name: 'Anglais', value: latest.english.minutes * 2, color: '#FFD600' },
      { name: 'Tech', value: latest.tech.tasksCompleted * 30, color: '#FF9100' },
    ].filter(d => d.value > 0);
  }, [days]);

  return (
    <section className="space-y-6">
      <StatsPanel
        title="Lecture rapide des KPI"
        subtitle="Les métriques synthétiques aident à garder une vue claire sur la progression réelle."
        stats={[
          ...statsCards,
          {
            label: 'Corrélation',
            value: `${calculateProductivityCorrelation(days).toFixed(2)}`,
            detail: 'Discipline vs production',
            progress: Math.abs(calculateProductivityCorrelation(days)) * 100,
            accent: '#00B4FF',
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="card-glass card-stagger h-[400px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Courbes</p>
              <h3 className="mt-2 font-syne text-xl font-bold">Derniers jours validés</h3>
            </div>
            <BarChart3 className="h-6 w-6 text-[var(--primary)]" />
          </div>
          {chartData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-[var(--text-muted)]">
              Valide quelques jours pour activer la courbe.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="spiritual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066FF" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0066FF" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="english" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B4FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00B4FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'var(--text)', fontSize: '13px' }}
                />
                <Area type="monotone" dataKey="spiritual" stroke="#0066FF" fill="url(#spiritual)" strokeWidth={2} />
                <Area type="monotone" dataKey="english" stroke="#00B4FF" fill="url(#english)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </article>

        <PredictiveCard days={days} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="card-glass h-[360px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Hebdo</p>
              <h3 className="mt-2 font-syne text-xl font-bold">Productivité par semaine</h3>
            </div>
            <Activity className="h-6 w-6 text-[var(--success)]" />
          </div>
          {weeklyData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-[var(--text-muted)]">
              Pas assez de données.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'var(--text)' }}
                />
                <Bar dataKey="tasks" fill="#0066FF" radius={[4, 4, 0, 0]} name="Tâches" />
                <Bar dataKey="pitches" fill="#00B4FF" radius={[4, 4, 0, 0]} name="Pitches" />
                <Bar dataKey="courses" fill="#00E676" radius={[4, 4, 0, 0]} name="Formations" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="card-glass h-[360px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Répartition</p>
              <h3 className="mt-2 font-syne text-xl font-bold">Discipline du jour</h3>
            </div>
            <PieChart className="h-6 w-6 text-[var(--warning)]" />
          </div>
          {disciplinePie.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-[var(--text-muted)]">
              Remplis la journée pour voir la répartition.
            </div>
          ) : (
            <div className="flex h-[260px] items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={disciplinePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {disciplinePie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'var(--text)' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="ml-4 space-y-2">
                {disciplinePie.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                    <span className="text-[var(--text-muted)]">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
