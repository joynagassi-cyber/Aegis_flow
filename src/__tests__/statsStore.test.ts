import { useStatsStore } from '../store/statsStore';

describe('StatsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useStatsStore.getState().reset();
  });

  it('initialises with default KPIs', () => {
    const { kpis } = useStatsStore.getState();
    expect(kpis.length).toBeGreaterThan(0);
  });

  it('updates a KPI', () => {
    const { kpis, updateKpi } = useStatsStore.getState();
    const id = kpis[0].id;
    updateKpi(id, { value: 999 });
    const updated = useStatsStore.getState().kpis.find(k => k.id === id);
    expect(updated?.value).toBe(999);
  });

  it('persists to localStorage', () => {
    const { kpis } = useStatsStore.getState();
    const stored = JSON.parse(localStorage.getItem('statsStore') as string);
    expect(stored.state.kpis).toEqual(kpis);
  });
});
