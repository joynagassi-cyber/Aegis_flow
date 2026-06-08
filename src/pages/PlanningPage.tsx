import { Moon, Sun } from 'lucide-react';

export function PlanningPage() {
  return (
    <section className="space-y-6">
      <div className="card-glass">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
          Routine
        </p>
        <h2 className="mt-2 font-syne text-2xl font-bold">Planning quotidien optimisé</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          L'emploi du temps Aegis Flow intègre tous les objectifs du programme 210 jours.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-glass space-y-3">
          <div className="flex items-center gap-2 text-[var(--warning)]">
            <Sun className="h-5 w-5" />
            <h3 className="font-syne font-bold">BLOC MATINAL</h3>
          </div>
          <p className="text-xs tracking-[0.25em] text-[var(--text-muted)]">05:00 — 12:00</p>
          <div className="space-y-2">
            {[
              { time: '05:00 — 09:00', task: 'Prière matinale intensive', dur: '4h', prio: 'Critique' },
              { time: '09:00 — 10:30', task: 'Lecture biblique (30-40 chap.)', dur: '1h30', prio: 'Critique' },
              { time: '10:30 — 11:00', task: 'Sport (pompes, abdos, squats)', dur: '30min', prio: 'Haute' },
              { time: '11:00 — 12:00', task: 'Lecture elite (35-50 pages)', dur: '1h', prio: 'Haute' },
            ].map((slot, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono-num text-xs text-[var(--primary)]">{slot.time}</span>
                  <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{slot.prio}</span>
                </div>
                <p className="mt-1 font-bold">{slot.task}</p>
                <p className="text-xs text-[var(--text-muted)]">{slot.dur}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Sun className="h-5 w-5" />
            <h3 className="font-syne font-bold">BLOC APRÈS-MIDI</h3>
          </div>
          <p className="text-xs tracking-[0.25em] text-[var(--text-muted)]">12:00 — 18:00</p>
          <div className="space-y-2">
            {[
              { time: '12:00 — 12:30', task: 'Repas + repos', dur: '30min', prio: 'Moyenne' },
              { time: '12:30 — 15:30', task: 'Deep Work Tech (MVP SaaS)', dur: '3h', prio: 'Critique' },
              { time: '15:30 — 16:15', task: 'Immersion anglais C2', dur: '45min', prio: 'Haute' },
              { time: '16:15 — 17:15', task: 'Geo-AI roadmap (pratique)', dur: '1h', prio: 'Haute' },
              { time: '17:15 — 18:00', task: 'Marketing & Cold emailing', dur: '45min', prio: 'Haute' },
            ].map((slot, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono-num text-xs text-[var(--primary)]">{slot.time}</span>
                  <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{slot.prio}</span>
                </div>
                <p className="mt-1 font-bold">{slot.task}</p>
                <p className="text-xs text-[var(--text-muted)]">{slot.dur}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass space-y-3">
          <div className="flex items-center gap-2 text-[var(--success)]">
            <Moon className="h-5 w-5" />
            <h3 className="font-syne font-bold">BLOC SOIRÉE</h3>
          </div>
          <p className="text-xs tracking-[0.25em] text-[var(--text-muted)]">18:00 — 22:00</p>
          <div className="space-y-2">
            {[
              { time: '18:00 — 18:30', task: 'Repas + repos', dur: '30min', prio: 'Moyenne' },
              { time: '18:30 — 19:00', task: 'Entraînement pitch', dur: '30min', prio: 'Haute' },
              { time: '19:00 — 20:00', task: 'Geo-AI (théorie + lecture)', dur: '1h', prio: 'Moyenne' },
              { time: '20:00 — 20:30', task: 'Ménage quotidien', dur: '30min', prio: 'Moyenne' },
              { time: '20:30 — 21:30', task: 'Lecture elite (35-50 pages)', dur: '1h', prio: 'Haute' },
              { time: '21:30 — 22:00', task: 'Revue de journée + planning J+1', dur: '30min', prio: 'Haute' },
            ].map((slot, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono-num text-xs text-[var(--primary)]">{slot.time}</span>
                  <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{slot.prio}</span>
                </div>
                <p className="mt-1 font-bold">{slot.task}</p>
                <p className="text-xs text-[var(--text-muted)]">{slot.dur}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-xs tracking-[0.25em] text-[var(--text-muted)]">NUIT</p>
            <p className="mt-1 font-bold">22:00 — 05:00 · Sommeil réparateur (7h)</p>
            <p className="text-xs text-[var(--text-muted)]">Priorité critique · Non négociable</p>
          </div>
        </div>
      </div>
    </section>
  );
}
