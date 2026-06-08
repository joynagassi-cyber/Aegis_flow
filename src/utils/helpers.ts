import { type DayData, type ProgramState, getInitialState, getWorkoutQuota } from '../data/initialData';

export const formatNumber = (value: number, suffix = '') =>
  `${new Intl.NumberFormat('fr-FR').format(value)}${suffix}`;

export const toPercent = (value: number, target: number) =>
  Math.max(0, Math.min(100, (value / Math.max(1, target)) * 100));

export const emptyDailyInput = (): ProgramState['currentDayInput'] => ({
  prayerHours: 0,
  bibleChapters: 0,
  fasting: false,
  englishMinutes: 0,
  techTasksCount: 0,
  marketingActions: '',
  pitchConfidence: 0,
  geoaiTasksCount: 0,
  sport: {
    pushups: 0, crunches: 0, squats: 0, plankSeconds: 0, jumpingJacks: 0, stretchingDone: false, cardioDone: false, cardioMinutes: 0,
  },
  menage: {
    daily: { lit: false, balayer: false, ranger: false, poubelles: false, bureau: false, vaisselle: false, salleDeBain: false, aerer: false },
    weekly: { balayageMaison: false, serpilliere: false, toilettes: false, salleDeBainComplet: false, depoussierage: false, lessive: false, fenetres: false, poubellesComplet: false },
    monthly: { derriereMeubles: false, desinfectionCuisine: false, rideauxDraps: false, desencombrement: false, ampoulesPrises: false },
  },
  sleep: { hoursSlept: 0, quality: 0, bedtime: '', wakeTime: '' },
  nutrition: { mealsCount: 0, waterGlasses: 0, qualityScore: 0 },
});

export const isDayValid = (state: ProgramState): boolean => {
  const input = state.currentDayInput;
  return (
    input.prayerHours > 0 ||
    input.bibleChapters > 0 ||
    input.englishMinutes > 0 ||
    input.techTasksCount > 0 ||
    input.sport.pushups > 0 ||
    input.sport.crunches > 0 ||
    input.sport.squats > 0 ||
    input.pitchConfidence > 0 ||
    input.marketingActions.trim() !== '' ||
    input.fasting ||
    state.dailyChecklist.reading
  );
};

export const buildValidatedDay = (state: ProgramState): DayData => {
  const current = state.currentDayInput;
  const readingCompleted = state.dailyChecklist.reading;
  const pushupsMet = current.sport.pushups >= getWorkoutQuota(state.currentDay, 'pushups');
  const crunchesMet = current.sport.crunches >= getWorkoutQuota(state.currentDay, 'crunches');
  const squatsMet = current.sport.squats >= getWorkoutQuota(state.currentDay, 'squats');

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
          (current.prayerHours / 6) * 45 + (current.bibleChapters / 40) * 35 + (current.fasting ? 20 : 0),
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
    sport: { ...current.sport },
    menage: current.menage,
    sleep: current.sleep,
    nutrition: current.nutrition,
    validated: pushupsMet || crunchesMet || squatsMet || readingCompleted || current.englishMinutes > 0,
    checklist: { ...state.dailyChecklist },
  };
};

export const hydrateState = (saved: unknown): ProgramState => {
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
    profilePhotoKey: partial.profilePhotoKey ?? base.profilePhotoKey,
    sidebarCollapsed: partial.sidebarCollapsed ?? base.sidebarCollapsed,
    geoaiRoadmap: partial.geoaiRoadmap ?? base.geoaiRoadmap,
    days: partial.days ?? base.days,
    books: partial.books ?? base.books,
    tasks: partial.tasks ?? base.tasks,
    pitchLogs: partial.pitchLogs ?? base.pitchLogs,
    projectLogs: partial.projectLogs ?? base.projectLogs,
  };
};
