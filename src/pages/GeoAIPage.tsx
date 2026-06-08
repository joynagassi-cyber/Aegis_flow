import { useMemo } from 'react';
import { CheckCircle2, Target, TrendingUp } from 'lucide-react';
import { GEOAI_ROADMAP } from '../data/geoaiRoadmap';
import { toPercent } from '../utils/helpers';

export function GeoAIPage() {
  const stats = useMemo(() => {
    const allWeeks = GEOAI_ROADMAP.mois.flatMap(m => m.semaines);
    const done = allWeeks.filter(w => w.statut === 'termine');
    const total = allWeeks.length;
    return {
      done: done.length,
      total,
      progress: toPercent(done.length, total),
      currentMonth: GEOAI_ROADMAP.mois.find(m =>
        m.semaines.some(w => w.statut === 'en_cours'),
      ),
      totalWeeks: total,
    };
  }, []);

  const roadmapMonths = useMemo(
    () =>
      GEOAI_ROADMAP.mois.map(month => ({
        ...month,
        doneWeeks: month.semaines.filter(week => week.statut === 'termine').length,
      })),
    [],
  );

  return (
    <section className="space-y-6">
      <div className="card-glass flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Roadmap</p>
          <h2 className="mt-2 font-syne text-2xl font-bold">{GEOAI_ROADMAP.titre}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {GEOAI_ROADMAP.regleOr} · {GEOAI_ROADMAP.dureeSemaines} semaines
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Mois courant</p>
          <p className="mt-1 text-xl font-bold">
            {stats.currentMonth?.titre ?? 'Tout est terminé'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-glass space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Target className="h-5 w-5" />
            <h3 className="font-syne font-bold">Progression</h3>
          </div>
          <p className="font-syne text-4xl font-bold">{stats.done}<span className="text-lg text-[var(--text-muted)]">/{stats.totalWeeks}</span></p>
          <p className="text-xs text-[var(--text-muted)]">Semaines terminées</p>
          <div className="h-2 rounded-full bg-[var(--surface-3)]">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${stats.progress}%` }} />
          </div>
        </div>

        <div className="card-glass space-y-3">
          <div className="flex items-center gap-2 text-[var(--success)]">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-syne font-bold">Mois</h3>
          </div>
          <p className="font-syne text-4xl font-bold">{GEOAI_ROADMAP.mois.length}</p>
          <p className="text-xs text-[var(--text-muted)]">Au total</p>
        </div>

        <div className="card-glass space-y-3">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-syne font-bold">Rythme</h3>
          </div>
          <p className="font-syne text-4xl font-bold">{Math.round(stats.progress)}%</p>
          <p className="text-xs text-[var(--text-muted)]">Du plan réalisé</p>
          <div className="h-2 rounded-full bg-[var(--surface-3)]">
            <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${stats.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {roadmapMonths.map(month => (
          <article key={month.id} className="card-glass space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
                  Mois {month.id}
                </p>
                <h3 className="mt-1 font-syne text-xl font-bold">{month.titre}</h3>
              </div>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-bold">
                {month.doneWeeks}/{month.semaines.length}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                style={{ width: `${toPercent(month.doneWeeks, month.semaines.length)}%` }}
              />
            </div>
            <div className="space-y-3">
              {month.semaines.slice(0, 3).map(week => (
                <div key={week.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                        Semaine {week.id}
                      </p>
                      <h4 className="mt-1 font-bold">{week.titre}</h4>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] ${
                      week.statut === 'termine'
                        ? 'bg-[var(--success)]/10 text-[var(--success)]'
                        : week.statut === 'en_cours'
                          ? 'bg-[var(--primary)]/10 text-[var(--accent)]'
                          : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                    }`}>
                      {week.statut === 'termine' ? 'Fait' : week.statut === 'en_cours' ? 'En cours' : 'À venir'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-muted)]">{week.objectif}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
