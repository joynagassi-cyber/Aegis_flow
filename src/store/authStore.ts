import { authService } from '../services/authService';
import { createStore } from './simpleStore';

interface AuthState {
  isAuthenticated: boolean;
  setAuth: (v: boolean) => void;
}

export const useAuthStore = createStore<AuthState>(set => ({
  isAuthenticated: !!authService.getToken(),
  setAuth: v => set({ isAuthenticated: v }),
}));

export const hydrateAuth = async () => {
  const authed = await authService.checkSession();
  useAuthStore.setState({ isAuthenticated: authed });
};
