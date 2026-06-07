import { insforge } from './insforge';

const STORAGE_KEY = 'AEGIS_FLOW_STATE';
const PENDING_SYNC_KEY = 'AEGIS_FLOW_PENDING_MUTATIONS';

export const SyncManager = {
  // Lire l'état actuel (Priorité Locale)
  getState: () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  // Sauvegarder l'état (Local + File d'attente)
  saveState: async (state: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Enregistrer une mutation en attente
    const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    pending.push({ timestamp: Date.now(), data: state });
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));

    if (navigator.onLine) {
      await SyncManager.sync();
    }
  },

  // Synchroniser avec InsForge
  sync: async (): Promise<boolean> => {
    const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    if (pending.length === 0) return false;
    if (!insforge) return false;

    try {
      // Envoyer le dernier état connu
      const currentState = SyncManager.getState();
      await insforge.database.from('user_state').upsert({
        id: 'global_state',
        data: currentState,
        updated_at: new Date().toISOString(),
      });

      // Si succès, vider la file
      localStorage.removeItem(PENDING_SYNC_KEY);
      console.log('Sync réussie avec InsForge');
      return true;
    } catch (e) {
      console.error('Erreur de sync, retry au prochain ligne...', e);
      return false;
    }
  }
};
