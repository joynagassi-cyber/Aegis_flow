import { insforge } from '../utils/insforge';

const TOKEN_KEY = "authToken";

export const authService = {
  async signUp(email: string, password: string) {
    if (!insforge) throw new Error('InsForge SDK non configuré. Vérifie VITE_INSFORGE_URL et VITE_INSFORGE_ANON_KEY');

    const { data, error } = await insforge.auth.signUp({ email, password });
    if (error) throw new Error(error.message || "Erreur d'inscription");
    if (data?.accessToken) {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
    }
    return data;
  },

  async signInWithPassword(email: string, password: string) {
    if (!insforge) throw new Error('InsForge SDK non configuré. Vérifie VITE_INSFORGE_URL et VITE_INSFORGE_ANON_KEY');

    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || "Erreur de connexion");
    if (data?.accessToken) {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
    }
    return data;
  },

  async signInWithGoogle() {
    if (!insforge) throw new Error('InsForge SDK non configuré');

    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await insforge.auth.signInWithOAuth({ provider: 'google', redirectTo });
    if (error) throw new Error(error.message || "Erreur Google Auth");
  },

  async checkSession(): Promise<boolean> {
    if (!insforge) return false;
    const { data, error } = await insforge.auth.getCurrentUser();
    return !error && !!data?.user;
  },

  signOut() {
    localStorage.removeItem(TOKEN_KEY);
    insforge?.auth.signOut();
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
};
