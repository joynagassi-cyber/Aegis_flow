import { CalendarDays, CheckCircle2, TrendingUp, Bell } from 'lucide-react';
import { useState } from 'react';
import { LoadingButton } from '../components/ui/LoadingButton';
import type { ProgramState } from '../data/initialData';
import { getWorkoutQuota } from '../data/initialData';
import { NumberField } from '../components/ui/NumberField';
import { ToggleCard } from '../components/ui/ToggleCard';
import { TextareaCard } from '../components/ui/TextareaCard';

interface DailyPageProps {
  state: ProgramState;
  onUpdateState: (updater: (prev: ProgramState) => ProgramState) => void;
  onValidateDay: () => void;
}

export function DailyPage({ state, onUpdateState, onValidateDay }: DailyPageProps) {
  const [validating, setValidating] = useState(false);

  const handleValidate = () => {
    setValidating(true);
    onValidateDay();
    setTimeout(() => setValidating(false), 800);
  };
  const updateInput = (key: keyof ProgramState['currentDayInput'], value: number | boolean | string) =>
    onUpdateState(prev => ({
      ...prev,
      currentDayInput: { ...prev.currentDayInput, [key]: value as never },
    }));

  const updateSport = (key: keyof ProgramState['currentDayInput']['sport'], value: number | boolean) =>
    onUpdateState(prev => ({
      ...prev,
      currentDayInput: {
        ...prev.currentDayInput,
        sport: { ...prev.currentDayInput.sport, [key]: value as never },
      },
    }));

  const updateSleep = (key: keyof ProgramState['currentDayInput']['sleep'], value: number) =>
    onUpdateState(prev => ({
      ...prev,
      currentDayInput: {
        ...prev.currentDayInput,
        sleep: { ...prev.currentDayInput.sleep, [key]: value },
      },
    }));

  const updateNutrition = (key: keyof ProgramState['currentDayInput']['nutrition'], value: number) =>
    onUpdateState(prev => ({
      ...prev,
      currentDayInput: {
        ...prev.currentDayInput,
        nutrition: { ...prev.currentDayInput.nutrition, [key]: value },
      },
    }));

  const toggleChecklist = (key: keyof ProgramState['dailyChecklist']) =>
    onUpdateState(prev => ({
      ...prev,
      dailyChecklist: {
        ...prev.dailyChecklist,
        [key]: !prev.dailyChecklist[key],
      } as ProgramState['dailyChecklist'],
    }));

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="card-glass space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
              Journal du jour
            </p>
            <h2 className="mt-2 font-syne text-2xl font-bold">Renseigner la journée</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Les valeurs se synchronisent localement puis vers InsForge.
            </p>
          </div>
          <LoadingButton onClick={handleValidate} loading={validating} icon={CheckCircle2}>
            Valider J{state.currentDay}
          </LoadingButton>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <NumberField
            label="Prière"
            value={state.currentDayInput.prayerHours}
            onChange={value => updateInput('prayerHours', value)}
            suffix="h"
          />
          <NumberField
            label="Bible"
            value={state.currentDayInput.bibleChapters}
            onChange={value => updateInput('bibleChapters', value)}
            suffix="chap."
          />
          <NumberField
            label="Anglais"
            value={state.currentDayInput.englishMinutes}
            onChange={value => updateInput('englishMinutes', value)}
            suffix="min"
          />
          <NumberField
            label="Tech"
            value={state.currentDayInput.techTasksCount}
            onChange={value => updateInput('techTasksCount', value)}
            suffix="tâches"
          />
          <NumberField
            label="Pitch"
            value={state.currentDayInput.pitchConfidence}
            onChange={value => updateInput('pitchConfidence', value)}
            suffix="/10"
          />
          <NumberField
            label="Geo-AI"
            value={state.currentDayInput.geoaiTasksCount}
            onChange={value => updateInput('geoaiTasksCount', value)}
            suffix="tâches"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ToggleCard
            label="Jeûne"
            checked={state.currentDayInput.fasting}
            onToggle={() => updateInput('fasting', !state.currentDayInput.fasting)}
          />
          <TextareaCard
            label="Marketing"
            value={state.currentDayInput.marketingActions}
            onChange={event =>
              onUpdateState(prev => ({
                ...prev,
                currentDayInput: { ...prev.currentDayInput, marketingActions: event.target.value },
              }))
            }
            placeholder="Actions réalisées aujourd'hui"
          />
        </div>
      </div>

      <div className="space-y-6">
        <section className="card-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Checklist
              </p>
              <h3 className="mt-2 font-syne text-xl font-bold">Socle quotidien</h3>
            </div>
            <CalendarDays className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['prayer', 'Prière'],
              ['bible', 'Bible'],
              ['fasting', 'Jeûne'],
              ['reading', 'Lecture'],
              ['english', 'Anglais'],
              ['techTask', 'Tech'],
              ['marketingAction', 'Marketing'],
              ['geoaiTask', 'Geo-AI'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleChecklist(key)}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  state.dailyChecklist[key]
                    ? 'border-[var(--success)] bg-[var(--success)]/10'
                    : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)]'
                }`}
              >
                <span className="text-sm font-bold">{label}</span>
                <span
                  className={`h-3 w-3 rounded-full ${
                    state.dailyChecklist[key]
                      ? 'bg-[var(--success)]'
                      : 'bg-[var(--text-subtle)]'
                  }`}
                />
              </button>
            ))}
          </div>
        </section>

        <section className="card-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Sport
              </p>
              <h3 className="mt-2 font-syne text-xl font-bold">Quotas du jour</h3>
            </div>
            <TrendingUp className="h-6 w-6 text-[var(--accent)]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['pushups', 'Pushups'],
              ['crunches', 'Crunches'],
              ['squats', 'Squats'],
              ['plankSeconds', 'Planche'],
              ['jumpingJacks', 'Jumping Jacks'],
              ['cardioMinutes', 'Cardio'],
            ] as const).map(([key, label]) => (
              <NumberField
                key={key}
                label={label}
                value={state.currentDayInput.sport[key] as number}
                onChange={value => updateSport(key, value)}
                suffix={key === 'plankSeconds' ? 'sec' : key === 'cardioMinutes' ? 'min' : 'rep'}
              />
            ))}
          </div>
        </section>

        <section className="card-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Récupération
              </p>
              <h3 className="mt-2 font-syne text-xl font-bold">Sommeil & Nutrition</h3>
            </div>
            <Bell className="h-6 w-6 text-[var(--warning)]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Sommeil"
              value={state.currentDayInput.sleep.hoursSlept}
              onChange={value => updateSleep('hoursSlept', value)}
              suffix="h"
            />
            <NumberField
              label="Qualité sommeil"
              value={state.currentDayInput.sleep.quality}
              onChange={value => updateSleep('quality', value)}
              suffix="/10"
            />
            <NumberField
              label="Repas"
              value={state.currentDayInput.nutrition.mealsCount}
              onChange={value => updateNutrition('mealsCount', value)}
              suffix="repas"
            />
            <NumberField
              label="Eau"
              value={state.currentDayInput.nutrition.waterGlasses}
              onChange={value => updateNutrition('waterGlasses', value)}
              suffix="verres"
            />
            <NumberField
              label="Qualité nutrition"
              value={state.currentDayInput.nutrition.qualityScore}
              onChange={value => updateNutrition('qualityScore', value)}
              suffix="/10"
            />
          </div>
        </section>
      </div>
    </section>
  );
}
