import { useEffect, useMemo, useState } from 'react';
import {
  LogOut,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Menu,
} from 'lucide-react';
import { Journal } from './components/Journal';
import { type StatCard } from './components/StatsPanel';
import { authService } from './services/authService';
import { hydrateAuth, useAuthStore } from './store/authStore';
import { SyncManager } from './utils/syncManager';
import { COMMAND_QUOTES } from './utils/quotes';
import { type Book, getInitialState, getWorkoutQuota, type ProgramState } from './data/initialData';
import { formatNumber, toPercent, emptyDailyInput, buildValidatedDay, hydrateState } from './utils/helpers';
import { OverviewPage } from './pages/OverviewPage';
import { SaaSObjectivesPage } from './pages/SaaSObjectivesPage';
import { DailyPage } from './pages/DailyPage';
import { TasksPage } from './pages/TasksPage';
import { BooksPage } from './pages/BooksPage';
import { GeoAIPage } from './pages/GeoAIPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PlanningPage } from './pages/PlanningPage';
import { PomodoroPage } from './pages/PomodoroPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { Sidebar, type TabId } from './components/Sidebar';
import { ArrowRightIcon } from './components/ui/ArrowRightIcon';
import { LoadingButton } from './components/ui/LoadingButton';
import { ChatPage } from './pages/ChatPage';
import { ArtifactsPage } from './pages/ArtifactsPage';
import { LandingPage } from './pages/LandingPage';
import { Logo } from './components/Logo';
import { ChatFloatingButton } from './components/ChatFloatingButton';
import { ChatOverlay } from './components/ChatOverlay';

type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'dashboard-theme';

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
    type?: 'success' | 'error' | 'info';
  } | null>(null);
  const [providerConfig, setProviderConfig] = useState<Record<string, string>>(() => {
    const providers = ['GEMINI', 'DEEPSEEK', 'OPENROUTER', 'FIREWORKS'];
    return providers.reduce(
      (acc, provider) => ({
        ...acc,
        [`${provider}_URL`]: localStorage.getItem(`API_URL_${provider}`) ?? '',
        [`${provider}_KEY`]: localStorage.getItem(`API_KEY_${provider}`) ?? '',
        [`${provider}_MODEL`]: localStorage.getItem(`API_MODEL_${provider}`) ?? '',
      }),
      {},
    );
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = SyncManager.getState() as Partial<ProgramState> | null;
    return saved?.sidebarCollapsed ?? false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOverlayOpen, setChatOverlayOpen] = useState(false);

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

  useEffect(() => { hydrateAuth(); }, []);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % COMMAND_QUOTES.length);
    }, 300000);

    const syncInterval = setInterval(() => {
      if (SyncManager.hasPendingSync()) {
        void SyncManager.retryPending();
      }
    }, 30000);

    const onOnline = () => {
      setSyncState('online');
      void SyncManager.retryPending();
    };
    const onOffline = () => setSyncState('offline');

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(syncInterval);
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
      label: 'Discipline', value: `${disciplineScore}%`,
      detail: 'Prière, lecture, sport et ménage', progress: disciplineScore, accent: '#0066FF',
    },
    {
      label: 'Clients payants', value: formatNumber(state.payingCustomers),
      detail: 'Base cumulée sur le parcours', progress: toPercent(state.payingCustomers, 100000), accent: '#00B4FF',
    },
    {
      label: 'MRR', value: `${formatNumber(state.mrr)}€`,
      detail: 'Revenu mensuel récurrent', progress: toPercent(state.mrr, 100000), accent: '#00E676',
    },
    {
      label: 'Livres terminés', value: `${finishedBooks}/350`,
      detail: 'Bibliothèque d\'élite', progress: toPercent(finishedBooks, 350), accent: '#FFD600',
    },
  ];

  const chartData = useMemo(
    () =>
      [...state.days]
        .slice(0, 14).reverse()
        .map(day => ({
          day: `J${day.dayNumber}`,
          spiritual: day.spiritual.score,
          english: day.english.minutes,
          customers: day.tech.payingCustomersDelta,
        })),
    [state.days],
  );

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  const notify = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ title, message, type });
    window.setTimeout(() => setNotification(null), 4200);
  };

  const handleValidateDay = () => {
    const validatedDay = buildValidatedDay(state);
    const nextDay = validatedDay.dayNumber + 1;
    const englishCompleted = validatedDay.english.completed;
    const sportCompleted =
      validatedDay.sport.pushups >= getWorkoutQuota(state.currentDay, 'pushups') &&
      validatedDay.sport.crunches >= getWorkoutQuota(state.currentDay, 'crunches') &&
      validatedDay.sport.squats >= getWorkoutQuota(state.currentDay, 'squats');
    const nextState: ProgramState = {
      ...state,
      currentDay: nextDay,
      days: [validatedDay, ...state.days].slice(0, 210),
      payingCustomers: state.payingCustomers + validatedDay.tech.payingCustomersDelta,
      mrr: state.mrr + validatedDay.tech.payingCustomersDelta * 99,
      featuresDelivered: state.featuresDelivered + validatedDay.tech.tasksCompleted,
      englishLevel: state.englishLevel + (englishCompleted ? 1 : 0),
      englishStreak: englishCompleted ? state.englishStreak + 1 : 0,
      sportStreak: sportCompleted ? state.sportStreak + 1 : 0,
      currentSaaSPhase:
        nextDay <= 30 ? 'MVP' : nextDay <= 60 ? 'Développement' : nextDay <= 90 ? 'Premier Paiement' : nextDay <= 120 ? 'Lancement' : 'Itérations',
      dailyChecklist: getInitialState().dailyChecklist,
      currentDayInput: emptyDailyInput(),
    };
    SyncManager.flushState(nextState);
    setState(nextState);
    notify(`Jour J${state.currentDay} validé`, 'Le quotidien a été archivé.', 'success');
  };

  const handleAddBook = (book: Book) => {
    const existing = state.books.find(entry => entry.id === book.id);
    if (existing) {
      setState(prev => ({
        ...prev,
        books: prev.books.map(b => b.id === book.id ? { ...book } : b),
      }));
      notify('Livre modifié', `${book.title} a été mis à jour.`, 'success');
      return;
    }
    const alreadyExists = state.books.some(
      entry => entry.title === book.title && entry.author === book.author,
    );
    if (alreadyExists) {
      notify('Livre déjà présent', 'Cette référence existe déjà.', 'error');
      return;
    }
    setState(prev => ({
      ...prev,
      books: [{ ...book, id: `book_${Date.now()}` }, ...prev.books],
    }));
    notify('Livre ajouté', `${book.title} a rejoint la bibliothèque.`, 'success');
  };

  const handleProviderConfig = (provider: string, field: 'URL' | 'KEY' | 'MODEL', value: string) => {
    const map = { URL: 'API_URL_', KEY: 'API_KEY_', MODEL: 'API_MODEL_' };
    localStorage.setItem(`${map[field]}${provider}`, value);
    setProviderConfig(prev => ({ ...prev, [`${provider}_${field}`]: value }));
  };

  const signOut = () => {
    authService.signOut();
    setAuth(false);
  };

  const toggleSidebar = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setMobileMenuOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => {
        const next = !prev;
        setState(s => ({ ...s, sidebarCollapsed: next }));
        return next;
      });
    }
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) setMobileMenuOpen(false);
  };

  const renderPage = () => {
    const key = activeTab;

    switch (activeTab) {
      case 'overview':
        return <OverviewPage key={key} state={state} currentQuote={currentQuote} />;
      case 'objectives':
        return <SaaSObjectivesPage key={key} state={state} />;
      case 'daily':
        return <DailyPage key={key} state={state} onUpdateState={setState} onValidateDay={handleValidateDay} />;
      case 'tasks':
        return <TasksPage key={key} activeTasks={activeTasks} />;
      case 'books':
        return <BooksPage key={key} state={state} onAddBook={handleAddBook} onToggleSort={() => setState(prev => ({ ...prev, books: prev.books.slice().reverse() }))} />;
      case 'artifacts':
        return <ArtifactsPage key={key} />;
      case 'geoai':
        return <GeoAIPage key={key} />;
      case 'journal':
        return <Journal key={key} />;
      case 'analytics':
        return <AnalyticsPage key={key} statsCards={statsCards} chartData={chartData} days={state.days} />;
      case 'planning':
        return <PlanningPage key={key} />;
      case 'pomodoro':
        return <PomodoroPage key={key} techTasksCount={state.currentDayInput.techTasksCount} />;
      case 'profile':
        return <ProfilePage key={key} state={state} onUpdateState={setState} />;
      case 'chat':
        return <ChatPage key={key} />;
      case 'settings':
        return (
          <SettingsPage
            key={key}
            theme={theme}
            onThemeChange={setTheme}
            providerConfig={providerConfig}
            onProviderConfig={handleProviderConfig}
            activeTasks={activeTasks}
            onSync={() =>
              void SyncManager.sync().then(sync =>
                notify(
                  'Synchronisation', sync ? 'Données poussées vers InsForge.' : 'Sync locale uniquement.',
                  sync ? 'success' : 'info',
                )
              )
            }
            daysCount={state.days.length}
          />
        );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,255,0.16),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(0,180,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(0,230,118,0.08),transparent_26%)]" />

      <Sidebar
        activeTab={activeTab}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onTabChange={handleTabChange}
        onToggleCollapse={toggleSidebar}
        onMobileClose={() => setMobileMenuOpen(false)}
        disciplineScore={disciplineScore}
      />

      <div
        className="dashboard-main min-h-screen"
        style={{ marginLeft: window.innerWidth >= 768 ? (sidebarCollapsed ? '68px' : '240px') : '0px' }}
      >
        <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 p-4 lg:p-6">
          <header className="card-glass flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--text)] lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2">
                  <Logo size={32} />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--text-muted)]">Aegis Flow</p>
                    <h1 className="font-syne text-lg font-bold">Command Center</h1>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">Jour</p>
                  <p className="mt-0.5 font-mono-num text-base font-bold">J{state.currentDay}</p>
                </div>
                <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 sm:block">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">Phase</p>
                  <p className="mt-0.5 text-sm font-bold">{state.currentSaaSPhase}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {syncState === 'online' ? (
                  <Wifi className="h-3.5 w-3.5 text-[var(--success)]" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-[var(--danger)]" />
                )}
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  {syncState === 'online' ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
                className="btn-secondary !rounded-xl !px-3 !py-2"
                title="Changer le thème"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <LoadingButton
                variant="secondary"
                onClick={() => {
                  setSyncState('syncing');
                  void SyncManager.sync().then(sync => {
                    setSyncState(sync ? 'online' : 'offline');
                    notify(sync ? 'Synchronisé' : 'Sync locale', sync ? 'Données poussées vers InsForge.' : 'Mode local.');
                  });
                }}
                loading={syncState === 'syncing'}
                className="!rounded-xl !px-3 !py-2"
                title="Synchroniser"
              >
                <ArrowRightIcon />
              </LoadingButton>

              <button type="button" onClick={signOut} className="btn-secondary !rounded-xl !px-3 !py-2" title="Déconnexion">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="max-w-4xl rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] px-5 py-3">
            <p className="text-sm leading-7 text-[var(--text-muted)]">
              <span className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-subtle)]">Citation · </span>
              {currentQuote.text}
              <span className="ml-2 text-xs text-[var(--text-subtle)]">— {currentQuote.author}</span>
            </p>
          </div>

          <main className="space-y-6 pb-6">
            <div key={activeTab} className="page-enter">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>

      <ChatFloatingButton isOpen={chatOverlayOpen} onClick={() => setChatOverlayOpen(!chatOverlayOpen)} />

      {chatOverlayOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:items-end md:p-6 pointer-events-none">
          <div
            className="pointer-events-auto flex h-[600px] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-2xl"
            style={{ background: 'rgba(10, 14, 23, 0.92)', boxShadow: '0 0 60px rgba(0, 180, 255, 0.15), 0 25px 80px rgba(0, 0, 0, 0.5)' }}
          >
            <ChatOverlay
              onClose={() => setChatOverlayOpen(false)}
              onOpenFull={() => { setChatOverlayOpen(false); setActiveTab('chat'); }}
            />
          </div>
        </div>
      )}

      {syncState === 'syncing' && (
        <div className="sync-progress">
          <div className="sync-progress-bar" />
        </div>
      )}

      {notification && (
        <div
          className={`toast-enter fixed bottom-4 right-4 z-50 max-w-md rounded-2xl border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${
            notification.type === 'success'
              ? 'border-[var(--success)]/30 bg-[var(--surface)]'
              : notification.type === 'error'
                ? 'border-[var(--danger)]/30 bg-[var(--surface)]'
                : 'border-[var(--primary)]/30 bg-[var(--surface)]'
          }`}
        >
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
            {notification.type === 'success' ? 'Succès' : notification.type === 'error' ? 'Erreur' : 'Notification'}
          </p>
          <h3 className="mt-2 font-syne text-lg font-bold">{notification.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{notification.message}</p>
        </div>
      )}
    </div>
  );
}
