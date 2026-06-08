import { Mail, BookOpen, Target, CalendarDays, Zap } from 'lucide-react';
import type { ProgramState } from '../data/initialData';
import { PhotoUpload } from '../components/PhotoUpload';
import { formatNumber, toPercent } from '../utils/helpers';

interface ProfilePageProps {
  state: ProgramState;
  onUpdateState: (updater: (prev: ProgramState) => ProgramState) => void;
}

export function ProfilePage({ state, onUpdateState }: ProfilePageProps) {
  const finishedBooks = state.books.filter(b => b.status === 'terminé').length;

  const stats = [
    { label: 'Jour actuel', value: `J${state.currentDay}`, sub: state.currentSaaSPhase, icon: CalendarDays },
    { label: 'Livres lus', value: `${finishedBooks}/350`, sub: `${state.books.length} dans la bibliothèque`, icon: BookOpen },
    { label: 'Clients SaaS', value: formatNumber(state.payingCustomers), sub: `MRR: ${formatNumber(state.mrr)}€`, icon: Target },
    { label: 'English Streak', value: `${state.englishStreak} jours`, sub: `Niveau ${state.englishLevel}`, icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div className="card-glass">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <PhotoUpload
            currentPhoto={state.userPhoto}
            onPhotoChange={(dataUrl, key) =>
              onUpdateState(prev => ({
                ...prev,
                userPhoto: dataUrl,
                profilePhotoKey: key,
              }))
            }
          />

          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Profil
              </p>
              <h2 className="mt-1 font-syne text-3xl font-bold">{state.userName}</h2>
            </div>

            <textarea
              value={state.userBio}
              onChange={e => onUpdateState(prev => ({ ...prev, userBio: e.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm leading-6 text-[var(--text-muted)] outline-none transition focus:border-[var(--primary)]"
              placeholder="Ajoute une bio..."
            />

            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm">
                <Mail className="mr-2 inline h-4 w-4 text-[var(--text-muted)]" />
                {state.userName.toLowerCase().replace(/\s+/g, '.')}@aegis.flow
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="card-glass card-glass-small space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
                  {stat.label}
                </p>
                <Icon className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <p className="font-syne text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="card-glass space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
            Objectifs
          </p>
          <h3 className="mt-1 font-syne text-xl font-bold">210-Day Mission</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Spirituel', target: '6h prière / jour', progress: Math.round((state.currentDayInput.prayerHours / 6) * 100) },
            { label: 'SaaS', target: '100 000 clients', progress: toPercent(state.payingCustomers, 100000) },
            { label: 'Lecture', target: '350 livres', progress: toPercent(finishedBooks, 350) },
          ].map(obj => (
            <div key={obj.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{obj.label}</p>
              <p className="mt-1 text-sm font-bold">{obj.target}</p>
              <div className="mt-3 h-2 rounded-full bg-[var(--surface-3)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)]"
                  style={{ width: `${obj.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
