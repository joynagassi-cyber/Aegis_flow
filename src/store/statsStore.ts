import { createStore } from './simpleStore';

export interface Kpi {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'steady' | 'down';
  accent: string;
}

interface StatsState {
  kpis: Kpi[];
  updateKpi: (id: string, changes: Partial<Omit<Kpi, 'id'>>) => void;
  reset: () => void;
}

const DEFAULT_KPIS: Kpi[] = [
  {
    id: 'discipline',
    label: 'Discipline',
    value: 78,
    target: 100,
    unit: '%',
    trend: 'up',
    accent: '#0066FF',
  },
  {
    id: 'mrr',
    label: 'MRR',
    value: 1240,
    target: 10000,
    unit: '€',
    trend: 'up',
    accent: '#00B4FF',
  },
  {
    id: 'focus',
    label: 'Focus',
    value: 85,
    target: 100,
    unit: '%',
    trend: 'steady',
    accent: '#00E676',
  },
  {
    id: 'books',
    label: 'Books',
    value: 12,
    target: 350,
    unit: '',
    trend: 'up',
    accent: '#FFD600',
  },
];

export const useStatsStore = createStore<StatsState>(
  set => ({
    kpis: DEFAULT_KPIS,
    updateKpi: (id, changes) =>
      set(state => ({
        kpis: state.kpis.map(kpi => (kpi.id === id ? { ...kpi, ...changes } : kpi)),
      })),
    reset: () => set({ kpis: DEFAULT_KPIS }),
  }),
  { storageKey: 'statsStore' },
);
