export function getApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return 'http://localhost:3001';
  return '';
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  return `${base}${path}`;
}
