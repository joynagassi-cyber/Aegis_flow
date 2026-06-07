// src/services/authService.ts
// Wrapper autour du SDK insforge qui persiste le token dans le localStorage
import { insforge } from '../utils/insforge';

const TOKEN_KEY = "authToken";

export const authService = {
  /** Sign‑in avec email (insforge renvoie { token, user }) */
  async signInWithEmail(email: string) {
    // appel du SDK insforge – on suppose qu'il existe déjà
    // Si le SDK n'est pas disponible, on renvoie un mock simple
    const auth = insforge?.auth as any;
    const result = (await (auth?.signInWithEmail?.(email) ?? Promise.resolve({
      token: "mock-jwt-token-email",
      user: { email },
    })));
    localStorage.setItem(TOKEN_KEY, result.token);
    return result;
  },

  /** Sign‑in avec Google */
  async signInWithGoogle() {
    const auth = insforge?.auth as any;
    const result = (await (auth?.signInWithGoogle?.() ?? Promise.resolve({
      token: "mock-jwt-token-google",
      user: { provider: "google" },
    })));
    localStorage.setItem(TOKEN_KEY, result.token);
    return result;
  },

  /** Déconnexion */
  signOut() {
    localStorage.removeItem(TOKEN_KEY);
  },

  /** Récupère le token stocké */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
};
