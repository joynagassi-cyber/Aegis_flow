import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';

type TimerMode = 'focus' | 'break' | 'idle';

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;
const POMODOROS_BEFORE_LONG_BREAK = 4;

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('idle');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const playBeep = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* Audio not supported */ }
  };

  const notify = (title: string, message: string) => {
    playBeep();
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };

  const handleTimerEnd = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      const total = pomodorosCompleted + 1;
      setPomodorosCompleted(total);
      if (total % POMODOROS_BEFORE_LONG_BREAK === 0) {
        setMode('break');
        setSecondsLeft(LONG_BREAK_MINUTES * 60);
      } else {
        setMode('break');
        setSecondsLeft(BREAK_MINUTES * 60);
      }
      notify('Pomodoro terminé', 'Prends une pause bien méritée.');
    } else {
      setMode('focus');
      setSecondsLeft(FOCUS_MINUTES * 60);
      notify('Pause terminée', 'Place au focus !');
    }
  };

  const start = () => {
    if (mode === 'idle') {
      setMode('focus');
      setSecondsLeft(FOCUS_MINUTES * 60);
    }
    setIsRunning(true);
  };

  const pause = () => setIsRunning(false);

  const reset = () => {
    setIsRunning(false);
    setMode('idle');
    setSecondsLeft(FOCUS_MINUTES * 60);
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalFocusMinutes = pomodorosCompleted * FOCUS_MINUTES;

  return (
    <div className="card-glass space-y-6" onClick={requestNotificationPermission}>
      <div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
          Productivity Timer
        </p>
        <h2 className="mt-2 font-syne text-2xl font-bold">
          {mode === 'idle' ? 'Prêt à travailler' : mode === 'focus' ? 'Focus' : 'Pause'}
        </h2>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-[var(--border)]">
          <span className="font-mono-num text-5xl font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <svg className="absolute h-full w-full -rotate-90">
            <circle
              cx="96" cy="96" r="88"
              fill="none"
              stroke="var(--border)"
              strokeWidth="4"
            />
            <circle
              cx="96" cy="96" r="88"
              fill="none"
              stroke={mode === 'focus' ? 'var(--primary)' : 'var(--success)'}
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={
                2 * Math.PI * 88 * (1 - secondsLeft / (mode === 'focus' || mode === 'idle' ? FOCUS_MINUTES * 60 : mode === 'break' && pomodorosCompleted % POMODOROS_BEFORE_LONG_BREAK === 0 ? LONG_BREAK_MINUTES * 60 : BREAK_MINUTES * 60))
              }
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
        </div>

        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button type="button" onClick={start} className="btn-primary flex items-center gap-2">
              <Play className="h-4 w-4" />
              {mode === 'idle' ? 'Commencer' : 'Reprendre'}
            </button>
          ) : (
            <button type="button" onClick={pause} className="btn-secondary flex items-center gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </button>
          )}
          <button type="button" onClick={reset} className="btn-secondary flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Pomodoros</p>
          <p className="mt-1 text-2xl font-bold">{pomodorosCompleted}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Focus</p>
          <p className="mt-1 text-2xl font-bold">{totalFocusMinutes}min</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-center">
          <Coffee className="mx-auto h-5 w-5 text-[var(--text-muted)]" />
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {pomodorosCompleted >= 4 ? 'Longue pause' : 'Pause courte'}
          </p>
        </div>
      </div>
    </div>
  );
}
