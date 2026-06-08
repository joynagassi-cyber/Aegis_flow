import { insforge } from './insforge';

const STORAGE_KEY = 'AEGIS_FLOW_STATE';
const PENDING_SYNC_KEY = 'AEGIS_FLOW_PENDING_MUTATIONS';
const MAX_PENDING = 50;

let _email: string | null = null;

export const setSyncEmail = (email: string | null) => { _email = email; };

export const SyncManager = {
  getState: () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  flushState: (state: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  saveState: async (state: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    pending.push({ timestamp: Date.now(), data: state });
    while (pending.length > MAX_PENDING) pending.shift();
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));

    if (navigator.onLine) {
      await SyncManager.sync();
    }
  },

  sync: async (): Promise<boolean> => {
    if (!_email) {
      if (insforge) {
        try {
          const { data } = await insforge.auth.getCurrentUser();
          _email = data?.user?.email ?? null;
        } catch {
          return false;
        }
      }
      if (!_email) return false;
    }

    const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    if (pending.length === 0) return true;

    try {
      const latest = pending[pending.length - 1];
      const stateToSync = latest?.data ?? SyncManager.getState();
      await insforge!.database.from('user_state').upsert({
        id: _email,
        data: stateToSync,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      localStorage.removeItem(PENDING_SYNC_KEY);
      return true;
    } catch (e) {
      console.error('Sync failed, will retry:', e);
      return false;
    }
  },

  retryPending: async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    const jitter = Math.random() * 4000;
    await new Promise(resolve => setTimeout(resolve, 1000 + jitter));
    return SyncManager.sync();
  },

  hasPendingSync: (): boolean => {
    const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    return pending.length > 0;
  },

  clearEmail: () => { _email = null; },
};
