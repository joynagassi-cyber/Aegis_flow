import { createClient, type InsForgeClient } from '@insforge/sdk';

const API_BASE_URL = import.meta.env.VITE_INSFORGE_URL?.trim() || 'http://localhost:7130';
const ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY?.trim() || '';

export const insforge: InsForgeClient | null = ANON_KEY
  ? createClient({ baseUrl: API_BASE_URL, anonKey: ANON_KEY })
  : null;
