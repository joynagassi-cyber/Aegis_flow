import { useEffect, useMemo, useState, type ChangeEvent, type ElementType } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Globe,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Rocket,
  Settings2,
  Sparkles,
  Sun,
  Target,
  Timer,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AuthModal } from './components/AuthModal';
import { Journal } from './components/Journal';
import { KanbanBoard } from './components/KanbanBoard';
import { PomodoroTimer } from './components/PomodoroTimer';
import { StatsPanel, type StatCard } from './components/StatsPanel';
import { authService } from './services/authService';
import { useAuthStore } from './store/authStore';
import { SyncManager } from './utils/syncManager';
import { COMMAND_QUOTES } from './utils/quotes';
import {
  Book,
  DayData,
  getInitialState,
  getWorkoutQuota,
  ProgramState,
  RECOMMENDED_BOOKS,
} from './data/initialData';
import { GEOAI_ROADMAP } from './data/geoaiRoadmap';
import {
  calculateProductivityCorrelation,
  predictFutureValue,
} from './utils/stats';

type ThemeMode = 'dark' | 'light';
type TabId =
  | 'overview'
  | 'daily'
  | 'tasks'
  | 'books'
  | 'geoai'
  | 'journal'
  | 'analytics'
  | 'planning'
  | 'pomodoro'
  | 'settings';

const THEME_STORAGE_KEY = 'dashboard-theme';

const TABS: Array<{ id: TabId; label: string; icon: ElementType }> = [
  { id: 'overview', label: 'Vue générale', icon: LayoutDashboard },
  { id: 'daily', label: 'Journée', icon: CalendarDays },
  { id: 'tasks', label: 'Tâches', icon: CheckCircle2 },
  { id: 'books', label: 'Bibliothèque', icon: BookOpen },
  { id: 'geoai', label: 'Geo-AI', icon: Rocket },
  { id: 'journal', label: 'Journal', icon: Sparkles },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'planning', label: 'Planning', icon: Clock },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { id: 'settings', label: 'Réglages', icon: Settings2 },
];

const emptyDailyInput = (): ProgramState['currentDayInput'] => ({
  prayerHours: 0,
  bibleChapters: 0,
  fasting: false,
  englishMinutes: 0,
  techTasksCount: 0,
  marketingActions: '',
  pitchConfidence: 0,
  geoaiTasksCount: 0,
  sport: {
    pushups: 0,
    crunches: 0,
    squats: 0,
    plankSeconds: 0,
    jumpingJacks: 0,
    stretchingDone: false,
    cardioDone: false,
    cardioMinutes: 0,
  },
  menage: {
    daily: {
      lit: false,
      balayer: false,
      ranger: false,
      poubelles: false,
      bureau: false,
      vaisselle: false,
      salleDeBain: false,
      aerer: false,
    },
    weekly: {
      balayageMaison: false,
      serpilliere: false,
      toilettes: false,
      salleDeBainComplet: false,
      depoussierage: false,
      lessive: false,
      fenetres: false,
      poubellesComplet: false,
    },
    monthly: {
      derriereMeubles: false,
      desinfectionCuisine: false,
      rideauxDraps: false,
      desencombrement: false,
      ampoulesPrises: false,
    },
  },
  sleep: { hoursSlept: 0, quality: 0, bedtime: '', wakeTime: '' },
  nutrition: { mealsCount: 0, waterGlasses: 0, qualityScore: 0 },
});

const hydrateState = (saved: unknown): ProgramState => {
  const base = getInitialState();
  if (!saved || typeof saved !== 'object') {
    return base;
  }

  const partial = saved as Partial<ProgramState>;
  return {
    ...base,
    ...partial,
    dailyChecklist: {
      ...base.dailyChecklist,
      ...(partial.dailyChecklist ?? {}),
    },
    currentDayInput: {
      ...base.currentDayInput,
      ...(partial.currentDayInput ?? {}),
      sport: {
        ...base.currentDayInput.sport,
        ...(partial.currentDayInput?.sport ?? {}),
      },
      menage: {
        ...base.currentDayInput.menage,
        ...(partial.currentDayInput?.menage ?? {}),
      },
      sleep: {
        ...base.currentDayInput.sleep,
        ...(partial.currentDayInput?.sleep ?? {}),
      },
      nutrition: {
        ...base.currentDayInput.nutrition,
        ...(partial.currentDayInput?.nutrition ?? {}),
      },
    },
    geoaiRoadmap: partial.geoaiRoadmap ?? base.geoaiRoadmap,
    days: partial.days ?? base.days,
    books: partial.books ?? base.books,
    tasks: partial.tasks ?? base.tasks,
    pitchLogs: partial.pitchLogs ?? base.pitchLogs,
    projectLogs: partial.projectLogs ?? base.projectLogs,
  };
};

const formatNumber = (value: number, suffix = '') =>
  `${new Intl.NumberFormat('fr-FR').format(value)}${suffix}`;

const toPercent = (value: number, target: number) =>
  Math.max(0, Math.min(100, (value / Math.max(1, target)) * 100));

const buildValidatedDay = (state: ProgramState): DayData => {
  const current = state.currentDayInput;
  const readingCompleted = state.dailyChecklist.reading;
  const sportQuotaMet =
    current.sport.pushups >= getWorkoutQuota(state.currentDay, 'pushups');

  return {
    dayNumber: state.currentDay,
    date: new Date().toISOString().split('T')[0],
    spiritual: {
      prayerHours: current.prayerHours,
      bibleChapters: current.bibleChapters,
      fasting: current.fasting,
      score: Math.min(
        100,
        Math.round(
          (current.prayerHours / 6) * 45 +
            (current.bibleChapters / 40) * 35 +
            (current.fasting ? 20 : 0),
        ),
      ),
    },
    reading: {
      pagesRead: readingCompleted ? 35 : 10,
      booksFinishedCount: state.books.filter(book => book.status === 'terminé').length,
    },
    english: {
      minutes: current.englishMinutes,
      completed: current.englishMinutes >= 45,
    },
    tech: {
      tasksCompleted: current.techTasksCount,
      payingCustomersDelta: current.techTasksCount * 14,
    },
    pitch: {
      pitchesDone: current.pitchConfidence > 0 ? 1 : 0,
      confidenceScore: current.pitchConfidence,
    },
    marketing: {
      coursesCompleted: state.dailyChecklist.marketingAction ? 1 : 0,
      actionsDone: state.dailyChecklist.marketingAction ? 1 : 0,
    },
    sport: {
      ...current.sport,
      stretchingDone: current.sport.stretchingDone,
      cardioDone: current.sport.cardioDone,
      cardioMinutes: current.sport.cardioMinutes,
    },
    menage: current.menage,
    sleep: current.sleep,
    nutrition: current.nutrition,
    validated: sportQuotaMet || readingCompleted || current.englishMinutes > 0,
  };
};

export default function App() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [state, setState] = useState<ProgramState>(() =>
    hydrateState(SyncManager.getState()),
  );
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'online' | 'offline'>(
    navigator.onLine ? 'online' : 'offline',
  );
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [providerConfig, setProviderConfig] = useState<Record<string, string>>(() => {
    const providers = ['GEMINI', 'DEEPSEEK', 'OPENROUTER', 'FIREWORKS'];
    return providers.reduce(
      (acc, provider) => ({
        ...acc,
        [`${provider}_URL`]: localStorage.getItem(`API_URL_${provider}`) ?? '',
        [`${provider}_KEY`]: localStorage.getItem(`API_KEY_${provider}`) ?? '',
      }),
      {},
    );
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void SyncManager.saveState(state);
    }, 350);

    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % COMMAND_QUOTES.length);
    }, 300000);

    const onOnline = () => setSyncState('online');
    const onOffline = () => setSyncState('offline');

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const currentQuote = COMMAND_QUOTES[quoteIndex % COMMAND_QUOTES.length];
  const finishedBooks = useMemo(
    () => state.books.filter(book => book.status === 'terminé').length,
    [state.books],
  );
  const activeTasks = useMemo(
    () => state.tasks.filter(task => task.status !== 'done').length,
    [state.tasks],
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
      detail: 'Bibliothèque d’élite',
      progress: toPercent(finishedBooks, 350),
      accent: '#FFD600',
    },
  ];

  const chartData = useMemo(
    () =>
      [...state.days]
        .slice(0, 14)
        .reverse()
        .map(day => ({
          day: `J${day.dayNumber}`,
          spiritual: day.spiritual.score,
          english: day.english.minutes,
          customers: day.tech.payingCustomersDelta,
        })),
    [state.days],
  );

  const roadmapMonths = useMemo(
    () =>
      GEOAI_ROADMAP.mois.map(month => ({
        ...month,
        doneWeeks: month.semaines.filter(week => week.statut === 'termine').length,
      })),
    [],
  );

  if (!isAuthenticated) {
    return <AuthModal onSuccess={() => setAuth(true)} />;
  }

  const notify = (title: string, message: string) => {
    setNotification({ title, message });
    window.setTimeout(() => setNotification(null), 4200);
  };

  const handleValidateDay = () => {
    const validatedDay = buildValidatedDay(state);

    setState(prev => {
      const nextDay = validatedDay.dayNumber + 1;
      const englishCompleted = validatedDay.english.completed;
      const sportCompleted =
        validatedDay.sport.pushups >= getWorkoutQuota(prev.currentDay, 'pushups') &&
        validatedDay.sport.crunches >= getWorkoutQuota(prev.currentDay, 'crunches') &&
        validatedDay.sport.squats >= getWorkoutQuota(prev.currentDay, 'squats');

      return {
        ...prev,
        currentDay: nextDay,
        days: [validatedDay, ...prev.days].slice(0, 210),
        payingCustomers: prev.payingCustomers + validatedDay.tech.payingCustomersDelta,
        mrr: prev.mrr + validatedDay.tech.payingCustomersDelta * 99,
        featuresDelivered: prev.featuresDelivered + validatedDay.tech.tasksCompleted,
        englishLevel: prev.englishLevel + (englishCompleted ? 1 : 0),
        englishStreak: englishCompleted ? prev.englishStreak + 1 : 0,
        sportStreak: sportCompleted ? prev.sportStreak + 1 : 0,
        currentSaaSPhase:
          nextDay <= 30
            ? 'Idéation'
            : nextDay <= 90
              ? 'MVP'
              : nextDay <= 150
                ? 'Beta'
                : nextDay <= 180
                  ? 'Lancement'
                  : 'Scale',
        dailyChecklist: getInitialState().dailyChecklist,
        currentDayInput: emptyDailyInput(),
      };
    });

    notify(
      `Jour J${state.currentDay} validé`,
      'Le quotidien a été archivé et les compteurs du dashboard ont été mis à jour.',
    );
  };

  const handleAddBook = (book: Book) => {
    const alreadyExists = state.books.some(
      entry => entry.title === book.title && entry.author === book.author,
    );

    if (alreadyExists) {
      notify('Livre déjà présent', 'Cette référence existe déjà dans la bibliothèque.');
      return;
    }

    setState(prev => ({
      ...prev,
      books: [
        {
          ...book,
          id: `book_${Date.now()}`,
        },
        ...prev.books,
      ],
    }));

    notify('Livre ajouté', `${book.title} a rejoint la bibliothèque personnelle.`);
  };

  const handleProviderConfig = (provider: string, field: 'URL' | 'KEY', value: string) => {
    const storageKey = field === 'URL' ? `API_URL_${provider}` : `API_KEY_${provider}`;
    localStorage.setItem(storageKey, value);
    setProviderConfig(prev => ({
      ...prev,
      [`${provider}_${field}`]: value,
    }));
  };

  const signOut = () => {
    authService.signOut();
    setAuth(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,255,0.16),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(0,180,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(0,230,118,0.08),transparent_26%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 p-4 lg:p-6">
        <header className="command-card flex flex-col gap-5 border-white/10 bg-[var(--surface)]/95 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--text-muted)]">
                  Titan-VII
                </p>
                <h1 className="mt-1 font-syne text-2xl font-bold">Deep Space Command Center</h1>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
                  Journée
                </p>
                <p className="mt-1 font-mono-num text-lg font-bold">
                  J{state.currentDay} · {state.currentSaaSPhase}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
                  Synchronisation
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold">
                  {syncState === 'online' ? (
                    <Wifi className="h-4 w-4 text-[var(--success)]" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-[var(--danger)]" />
                  )}
                  {syncState === 'online' ? 'Connecté' : 'Hors ligne'}
                </p>
              </div>
            </div>

            <div className="max-w-4xl rounded-[28px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Citation active
              </p>
              <p className="mt-3 text-xl leading-8 text-[var(--text)] md:text-2xl">
                {currentQuote.text}
              </p>
              <p className="mt-3 text-sm uppercase tracking-[0.25em] text-[var(--text-muted)]">
                {currentQuote.author}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:w-[320px]">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
                className="btn-secondary"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? 'Clair' : 'Sombre'}
              </button>
              <button
                type="button"
                onClick={() =>
                  void SyncManager.sync().then(sync =>
                    notify(
                      sync ? 'Synchronisé' : 'Sync locale',
                      sync
                        ? 'Les données ont été poussées vers InsForge.'
                        : 'InsForge n’est pas configuré, les données restent locales.',
                    )
                  )
                }
                className="btn-secondary"
              >
                <ArrowRightIcon />
                Sync
              </button>
            </div>

            <button type="button" onClick={signOut} className="btn-secondary justify-center">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                    Priorité du jour
                  </p>
                  <p className="mt-2 font-syne text-lg font-bold">Discipline socle</p>
                </div>
                <Target className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Score</span>
                  <span className="font-bold">{disciplineScore}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${disciplineScore}%` }}
                  />
                </div>
                <p className="text-xs leading-6 text-[var(--text-muted)]">
                  La journée pilote la performance des piliers Spirituel et SaaS.
                </p>
              </div>
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_30px_rgba(0,102,255,0.25)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <main className="space-y-6 pb-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <StatsPanel
                title="Pilotage global"
                subtitle="Les KPI les plus visibles sont regroupés ici pour relier la discipline quotidienne aux deux piliers du dashboard."
                stats={statsCards}
              />

              <section className="grid gap-6 xl:grid-cols-2">
                <article className="command-card space-y-4">
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

                <article className="command-card space-y-4">
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
            </div>
          )}

          {activeTab === 'daily' && (
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="command-card space-y-6">
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
                  <button type="button" onClick={handleValidateDay} className="btn-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Valider J{state.currentDay}
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <NumberField
                    label="Prière"
                    value={state.currentDayInput.prayerHours}
                    onChange={value =>
                      setState(prev => ({
                        ...prev,
                        currentDayInput: {
                          ...prev.currentDayInput,
                          prayerHours: value,
                        },
                      }))
                    }
                    suffix="h"
                  />
                  <NumberField
                    label="Bible"
                    value={state.currentDayInput.bibleChapters}
                    onChange={value =>
                      setState(prev => ({
                        ...prev,
                        currentDayInput: {
                          ...prev.currentDayInput,
                          bibleChapters: value,
                        },
                      }))
                    }
                    suffix="chap."
                  />
                  <NumberField
                    label="Anglais"
                    value={state.currentDayInput.englishMinutes}
                    onChange={value =>
                      setState(prev => ({
                        ...prev,
                        currentDayInput: {
                          ...prev.currentDayInput,
                          englishMinutes: value,
                        },
                      }))
                    }
                    suffix="min"
                  />
                  <NumberField
                    label="Tech"
                    value={state.currentDayInput.techTasksCount}
                    onChange={value =>
                      setState(prev => ({
                        ...prev,
                        currentDayInput: {
                          ...prev.currentDayInput,
                          techTasksCount: value,
                        },
                      }))
                    }
                    suffix="tâches"
                  />
                  <NumberField
                    label="Pitch"
                    value={state.currentDayInput.pitchConfidence}
                    onChange={value =>
                      setState(prev => ({
                        ...prev,
                        currentDayInput: {
                          ...prev.currentDayInput,
                          pitchConfidence: value,
                        },
                      }))
                    }
                    suffix="/10"
                  />
                  <NumberField
                    label="Geo-AI"
                    value={state.currentDayInput.geoaiTasksCount}
                    onChange={value =>
                      setState(prev => ({
                        ...prev,
                        currentDayInput: {
                          ...prev.currentDayInput,
                          geoaiTasksCount: value,
                        },
                      }))
                    }
                    suffix="tâches"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ToggleCard
                    label="Jeûne"
                    checked={state.currentDayInput.fasting}
                    onToggle={() =>
                      setState(prev => ({
                        ...prev,
                        currentDayInput: {
                          ...prev.currentDayInput,
                          fasting: !prev.currentDayInput.fasting,
                        },
                      }))
                    }
                  />
                  <TextareaCard
                    label="Marketing"
                    value={state.currentDayInput.marketingActions}
                    onChange={event =>
                      setState(prev => ({
                        ...prev,
                        currentDayInput: {
                          ...prev.currentDayInput,
                          marketingActions: event.target.value,
                        },
                      }))
                    }
                    placeholder="Actions réalisées aujourd'hui"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <section className="command-card space-y-4">
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
                    {[
                      ['prayer', 'Prière'],
                      ['bible', 'Bible'],
                      ['fasting', 'Jeûne'],
                      ['reading', 'Lecture'],
                      ['english', 'Anglais'],
                      ['techTask', 'Tech'],
                      ['marketingAction', 'Marketing'],
                      ['geoaiTask', 'Geo-AI'],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setState(prev => ({
                            ...prev,
                            dailyChecklist: {
                              ...prev.dailyChecklist,
                              [key]:
                                !prev.dailyChecklist[
                                  key as keyof ProgramState['dailyChecklist']
                                ],
                            } as ProgramState['dailyChecklist'],
                          }))
                        }
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          state.dailyChecklist[key as keyof ProgramState['dailyChecklist']]
                            ? 'border-[var(--success)] bg-[var(--success)]/10'
                            : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <span className="text-sm font-bold">{label}</span>
                        <span
                          className={`h-3 w-3 rounded-full ${
                            state.dailyChecklist[key as keyof ProgramState['dailyChecklist']]
                              ? 'bg-[var(--success)]'
                              : 'bg-[var(--text-subtle)]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </section>

                <section className="command-card space-y-4">
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
                    {[
                      ['pushups', 'Pushups'],
                      ['crunches', 'Crunches'],
                      ['squats', 'Squats'],
                      ['plankSeconds', 'Planche'],
                      ['jumpingJacks', 'Jumping Jacks'],
                      ['cardioMinutes', 'Cardio'],
                    ].map(([key, label]) => (
                      <NumberField
                        key={key}
                        label={label}
                        value={
                          state.currentDayInput.sport[key as keyof ProgramState['currentDayInput']['sport']] as number
                        }
                        onChange={value =>
                          setState(prev => ({
                            ...prev,
                            currentDayInput: {
                              ...prev.currentDayInput,
                              sport: {
                                ...prev.currentDayInput.sport,
                                [key]: value,
                              } as ProgramState['currentDayInput']['sport'],
                            },
                          }))
                        }
                        suffix={
                          key === 'plankSeconds'
                            ? 'sec'
                            : key === 'cardioMinutes'
                              ? 'min'
                              : 'rep'
                        }
                      />
                    ))}
                  </div>
                </section>

                <section className="command-card space-y-4">
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
                      onChange={value =>
                        setState(prev => ({
                          ...prev,
                          currentDayInput: {
                            ...prev.currentDayInput,
                            sleep: { ...prev.currentDayInput.sleep, hoursSlept: value },
                          },
                        }))
                      }
                      suffix="h"
                    />
                    <NumberField
                      label="Qualité sommeil"
                      value={state.currentDayInput.sleep.quality}
                      onChange={value =>
                        setState(prev => ({
                          ...prev,
                          currentDayInput: {
                            ...prev.currentDayInput,
                            sleep: { ...prev.currentDayInput.sleep, quality: value },
                          },
                        }))
                      }
                      suffix="/10"
                    />
                    <NumberField
                      label="Repas"
                      value={state.currentDayInput.nutrition.mealsCount}
                      onChange={value =>
                        setState(prev => ({
                          ...prev,
                          currentDayInput: {
                            ...prev.currentDayInput,
                            nutrition: { ...prev.currentDayInput.nutrition, mealsCount: value },
                          },
                        }))
                      }
                      suffix="repas"
                    />
                    <NumberField
                      label="Eau"
                      value={state.currentDayInput.nutrition.waterGlasses}
                      onChange={value =>
                        setState(prev => ({
                          ...prev,
                          currentDayInput: {
                            ...prev.currentDayInput,
                            nutrition: { ...prev.currentDayInput.nutrition, waterGlasses: value },
                          },
                        }))
                      }
                      suffix="verres"
                    />
                    <NumberField
                      label="Qualité nutrition"
                      value={state.currentDayInput.nutrition.qualityScore}
                      onChange={value =>
                        setState(prev => ({
                          ...prev,
                          currentDayInput: {
                            ...prev.currentDayInput,
                            nutrition: { ...prev.currentDayInput.nutrition, qualityScore: value },
                          },
                        }))
                      }
                      suffix="/10"
                    />
                  </div>
                </section>
              </div>
            </section>
          )}

          {activeTab === 'tasks' && (
            <section className="command-card space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                    Exécution
                  </p>
                  <h2 className="mt-2 font-syne text-2xl font-bold">Kanban opérationnel</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    La colonne de travail est alignée sur le statut `in_progress`.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                    Tâches actives
                  </p>
                  <p className="mt-1 text-2xl font-bold">{activeTasks}</p>
                </div>
              </div>
              <KanbanBoard />
            </section>
          )}

          {activeTab === 'books' && (
            <section className="space-y-6">
              <div className="command-card flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                    Bibliothèque
                  </p>
                  <h2 className="mt-2 font-syne text-2xl font-bold">Livres utiles au plan</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Les recommandations sont prêtes à être ajoutées à ta bibliothèque personnelle.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                      Terminés
                    </p>
                    <p className="mt-1 text-xl font-bold">{finishedBooks}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                      Recommandés
                    </p>
                    <p className="mt-1 text-xl font-bold">{RECOMMENDED_BOOKS.length}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {RECOMMENDED_BOOKS.slice(0, 12).map(book => (
                  <article
                    key={book.id}
                    className="command-card space-y-4 border border-[var(--border)] bg-[var(--surface)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
                          {book.category}
                        </p>
                        <h3 className="mt-2 font-syne text-lg font-bold">{book.title}</h3>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{book.author}</p>
                      </div>
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                        style={{ background: book.coverColor }}
                      >
                        <BookOpen className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-[var(--text-muted)]">{book.summary}</p>
                    <button
                      type="button"
                      onClick={() => handleAddBook(book)}
                      className="btn-secondary w-full justify-center"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </button>
                  </article>
                ))}
              </div>

              <div className="command-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                      Bibliothèque personnelle
                    </p>
                    <h3 className="mt-2 font-syne text-xl font-bold">{state.books.length} entrées</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, books: prev.books.slice().reverse() }))}
                    className="btn-secondary"
                  >
                    Trier
                  </button>
                </div>
                {state.books.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">
                    Aucun livre personnel pour l’instant. Ajoute une recommandation pour commencer.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {state.books.slice(0, 6).map(book => (
                      <article
                        key={book.id}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-bold">{book.title}</h4>
                            <p className="text-xs text-[var(--text-muted)]">{book.author}</p>
                          </div>
                          <span
                            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white"
                            style={{ background: book.coverColor }}
                          >
                            {book.status}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-[var(--text-muted)]">{book.summary}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'geoai' && (
            <section className="space-y-6">
              <div className="command-card flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                    Roadmap
                  </p>
                  <h2 className="mt-2 font-syne text-2xl font-bold">{GEOAI_ROADMAP.titre}</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {GEOAI_ROADMAP.regleOr} · {GEOAI_ROADMAP.dureeSemaines} semaines
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                    Mois courant
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {GEOAI_ROADMAP.mois.find(month =>
                      month.semaines.some(week => week.statut !== 'termine'),
                    )?.titre ?? 'Tout est terminé'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {roadmapMonths.map(month => (
                  <article key={month.id} className="command-card space-y-4">
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
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${toPercent(month.doneWeeks, month.semaines.length)}%` }}
                      />
                    </div>
                    <div className="space-y-3">
                      {month.semaines.slice(0, 3).map(week => (
                        <div
                          key={week.id}
                          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                                Semaine {week.id}
                              </p>
                              <h4 className="mt-1 font-bold">{week.titre}</h4>
                            </div>
                            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                              {week.statut}
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
          )}

          {activeTab === 'journal' && <Journal />}

          {activeTab === 'analytics' && (
            <section className="space-y-6">
              <StatsPanel
                title="Lecture rapide des KPI"
                subtitle="Les métriques synthétiques aident à garder une vue claire sur la progression réelle."
                stats={[
                  ...statsCards,
                  {
                    label: 'Corrélation',
                    value: `${calculateProductivityCorrelation(state.days).toFixed(2)}`,
                    detail: 'Discipline vs production',
                    progress: Math.abs(calculateProductivityCorrelation(state.days)) * 100,
                    accent: '#00B4FF',
                  },
                ]}
              />

              <div className="grid gap-6 xl:grid-cols-2">
                <article className="command-card h-[420px]">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                        Courbes
                      </p>
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
                        <XAxis dataKey="day" stroke="var(--text-muted)" />
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            color: 'var(--text)',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="spiritual"
                          stroke="#0066FF"
                          fill="url(#spiritual)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="english"
                          stroke="#00B4FF"
                          fill="url(#english)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </article>

                <article className="command-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                        Projection
                      </p>
                      <h3 className="mt-2 font-syne text-xl font-bold">Estimation à 30 jours</h3>
                    </div>
                    <TrendingUp className="h-6 w-6 text-[var(--success)]" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                      <p className="text-sm text-[var(--text-muted)]">Clients payants</p>
                      <p className="mt-2 text-3xl font-bold">
                        {Math.round(predictFutureValue(state.days, 'payingCustomers', 30))}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                      <p className="text-sm text-[var(--text-muted)]">MRR projeté</p>
                      <p className="mt-2 text-3xl font-bold">
                        {Math.round(predictFutureValue(state.days, 'mrr', 30))}€
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <p className="text-sm text-[var(--text-muted)]">Lecture rapide</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                      Plus la discipline quotidienne est stable, plus la base SaaS et l’énergie
                      d’exécution progressent ensemble.
                    </p>
                  </div>
                </article>
              </div>
            </section>
          )}

          {activeTab === 'planning' && (
            <section className="space-y-6">
              <div className="command-card">
                <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                  Routine
                </p>
                <h2 className="mt-2 font-syne text-2xl font-bold">Planning quotidien optimisé</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  L'emploi du temps TITAN-VII intègre tous les objectifs du programme 210 jours.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="command-card space-y-3">
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

                <div className="command-card space-y-3">
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

                <div className="command-card space-y-3">
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
          )}

          {activeTab === 'pomodoro' && (
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <PomodoroTimer />
              <div className="command-card space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                    Méthode
                  </p>
                  <h3 className="mt-2 font-syne text-xl font-bold">Deep Work Protocol</h3>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Session</p>
                    <p className="mt-1 text-lg font-bold">25 min focus · 5 min pause</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Cycle long</p>
                    <p className="mt-1 text-lg font-bold">4 pomodoros → 15 min pause</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Rythme cible</p>
                    <p className="mt-1 text-lg font-bold">{Math.floor(state.currentDayInput.techTasksCount * 4)} sessions/jour</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <article className="command-card space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                      Apparence
                    </p>
                    <h2 className="mt-2 font-syne text-2xl font-bold">Thème et session</h2>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`btn-secondary justify-center ${theme === 'dark' ? 'border-[var(--primary)] text-[var(--text)]' : ''}`}
                    >
                      <Moon className="h-4 w-4" />
                      Sombre
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`btn-secondary justify-center ${theme === 'light' ? 'border-[var(--primary)] text-[var(--text)]' : ''}`}
                    >
                      <Sun className="h-4 w-4" />
                      Clair
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void SyncManager.sync().then(sync =>
                        notify(
                          'Synchronisation manuelle',
                          sync
                            ? 'La file locale a été vidée et poussée vers InsForge.'
                            : 'La synchronisation est restée locale ou aucun backend n’est configuré.',
                        )
                      )
                    }
                    className="btn-primary w-full justify-center"
                  >
                    <Wifi className="h-4 w-4" />
                    Forcer la sync
                  </button>
                </article>

                <article className="command-card space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                      Configuration IA
                    </p>
                    <h2 className="mt-2 font-syne text-2xl font-bold">Providers locaux</h2>
                  </div>
                  {['GEMINI', 'DEEPSEEK', 'OPENROUTER', 'FIREWORKS'].map(provider => (
                    <div
                      key={provider}
                      className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                        {provider}
                      </p>
                      <input
                        value={providerConfig[`${provider}_URL`] ?? ''}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleProviderConfig(provider, 'URL', event.target.value)
                        }
                        placeholder="URL"
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                      />
                      <input
                        value={providerConfig[`${provider}_KEY`] ?? ''}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleProviderConfig(provider, 'KEY', event.target.value)
                        }
                        placeholder="Clé API"
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                      />
                    </div>
                  ))}
                </article>
              </div>

              <div className="command-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                      Résumé
                    </p>
                    <h3 className="mt-2 font-syne text-xl font-bold">État du dashboard</h3>
                  </div>
                  <Bell className="h-6 w-6 text-[var(--warning)]" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <InfoTile label="Jours validés" value={state.days.length} icon={CheckCircle2} />
                  <InfoTile label="Tâches en cours" value={activeTasks} icon={Code2} />
                  <InfoTile label="Mots-clés actifs" value={COMMAND_QUOTES.length} icon={Globe} />
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {notification && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-2xl border border-[var(--primary)]/30 bg-[var(--surface)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
            Notification
          </p>
          <h3 className="mt-2 font-syne text-lg font-bold">{notification.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{notification.message}</p>
        </div>
      )}
    </div>
  );
}

function ArrowRightIcon() {
  return <ChevronRight className="h-4 w-4" />;
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <span className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={event => onChange(Number(event.target.value))}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-lg font-bold outline-none transition focus:border-[var(--primary)]"
        />
        {suffix && <span className="text-xs text-[var(--text-muted)]">{suffix}</span>}
      </div>
    </label>
  );
}

function ToggleCard({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-2xl border p-4 text-left transition ${
        checked
          ? 'border-[var(--success)] bg-[var(--success)]/10'
          : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-sm font-bold">{checked ? 'Activé' : 'Désactivé'}</p>
        </div>
        <span
          className={`h-4 w-4 rounded-full ${
            checked ? 'bg-[var(--success)]' : 'bg-[var(--text-subtle)]'
          }`}
        />
      </div>
    </button>
  );
}

function TextareaCard({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}) {
  return (
    <label className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <span className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{label}</span>
      <textarea
        value={value}
        onChange={onChange}
        rows={4}
        placeholder={placeholder}
        className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
      />
    </label>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ElementType;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-[var(--primary)]" />
      </div>
    </div>
  );
}
