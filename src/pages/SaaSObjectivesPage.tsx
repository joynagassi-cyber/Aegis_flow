import { useMemo } from 'react';
import { Flag, TrendingUp, Users, DollarSign, Code2, CheckCircle2 } from 'lucide-react';
import type { ProgramState } from '../data/initialData';
import { SAAS_PHASES, getCurrentPhase, getPhaseProgress } from '../data/saasObjectives';
import { toPercent } from '../utils/helpers';

interface SaaSObjectivesPageProps {
  state: ProgramState;
}

export function SaaSObjectivesPage({ state }: SaaSObjectivesPageProps) {
  const currentPhase = useMemo(() => getCurrentPhase(state.currentDay), [state.currentDay]);
  const phaseProgress = useMemo(
    () => getPhaseProgress(state.currentDay, currentPhase, {
      mrr: state.mrr,
      customers: state.payingCustomers,
      features: state.featuresDelivered,
    }),
    [state.currentDay, currentPhase, state.mrr, state.payingCustomers, state.featuresDelivered],
  );

  const kpiCards = useMemo(() => {
    const phaseTarget = currentPhase.targets;
    return [
      {
        label: 'MRR',
        value: `${state.mrr}€`,
        target: `${phaseTarget.mrr}€`,
        progress: toPercent(state.mrr, phaseTarget.mrr),
        icon: DollarSign,
        color: '#00E676',
      },
      {
        label: 'Clients payants',
        value: state.payingCustomers.toString(),
        target: phaseTarget.customers.toString(),
        progress: toPercent(state.payingCustomers, phaseTarget.customers),
        icon: Users,
        color: '#00B4FF',
      },
      {
        label: 'Fonctionnalités',
        value: state.featuresDelivered.toString(),
        target: phaseTarget.features.toString(),
        progress: toPercent(state.featuresDelivered, phaseTarget.features),
        icon: Code2,
        color: '#0066FF',
      },
    ];
  }, [state.mrr, state.payingCustomers, state.featuresDelivered, currentPhase]);

  const milestones = useMemo(
    () => state.projectLogs.filter(log => log.tag === 'milestone').slice(0, 10),
    [state.projectLogs],
  );

  return (
    <div className="space-y-6">
      <section className="card-glass space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
              Roadmap
            </p>
            <h2 className="mt-1 font-syne text-2xl font-bold">Phases SaaS</h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {SAAS_PHASES.map((phase, index) => {
            const isCurrent = phase.id === currentPhase.id;
            const isPast = state.currentDay > phase.daysEnd;
            return (
              <button
                key={phase.id}
                onClick={() => {}}
                className={`relative rounded-xl border p-4 text-left transition-all ${
                  isCurrent
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-[0_0_20px_rgba(0,102,255,0.15)]'
                    : isPast
                      ? 'border-[var(--border)] bg-[var(--surface-2)] opacity-60'
                      : 'border-[var(--border)] bg-[var(--surface-2)] opacity-40'
                }`}
                style={isCurrent ? { borderColor: phase.color, boxShadow: `0 0 20px ${phase.color}22` } : undefined}
              >
                {isCurrent && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: phase.color }}
                  >
                    {index + 1}
                  </span>
                )}
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Phase {index + 1}</p>
                <p
                  className="mt-2 font-syne text-lg font-bold"
                  style={{ color: isCurrent ? phase.color : undefined }}
                >
                  {phase.label}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                  {phase.description}
                </p>
                {isCurrent && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Progression</span>
                      <span className="font-bold" style={{ color: phase.color }}>{phaseProgress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-[var(--surface-3)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${phaseProgress}%`, background: phase.color }}
                      />
                    </div>
                  </div>
                )}
                {isPast && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--success)]">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Terminée</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-glass space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[var(--success)]/10 p-3 text-[var(--success)]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
              Phase actuelle
            </p>
            <h2 className="mt-1 font-syne text-2xl font-bold" style={{ color: currentPhase.color }}>
              {currentPhase.label}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{currentPhase.description}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {kpiCards.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{kpi.label}</p>
                  <Icon className="h-5 w-5" style={{ color: kpi.color }} />
                </div>
                <p className="mt-3 font-syne text-3xl font-bold">{kpi.value}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Objectif: {kpi.target}</p>
                <div className="mt-4 h-2 rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${kpi.progress}%`, background: kpi.color }}
                  />
                </div>
                <p className="mt-2 text-right text-xs font-bold" style={{ color: kpi.color }}>
                  {Math.round(kpi.progress)}%
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card-glass space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--warning)]/10 p-3 text-[var(--warning)]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Objectifs
              </p>
              <h3 className="mt-1 font-syne text-lg font-bold">Phase : {currentPhase.label}</h3>
            </div>
          </div>
          <ul className="space-y-2">
            {currentPhase.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: currentPhase.color }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-6 text-[var(--text)]">{obj}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-glass space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--accent)]/10 p-3 text-[var(--accent)]">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Jalons
              </p>
              <h3 className="mt-1 font-syne text-lg font-bold">Étapes clés</h3>
            </div>
          </div>
          {milestones.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">
              Aucun jalon enregistré. Ajoute des jalons via les logs projet.
            </div>
          ) : (
            <div className="space-y-2">
              {milestones.map(m => (
                <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{m.title}</p>
                    <span className="text-[10px] text-[var(--text-muted)]">{m.date}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{m.content}</p>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-xs font-bold text-[var(--text-muted)]">Jalons de la phase</p>
            <ul className="mt-2 space-y-1.5">
              {currentPhase.milestones.map((m, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: currentPhase.color }} />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
