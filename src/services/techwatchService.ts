import { apiUrl } from './apiConfig';

export interface TechWatchDomain {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  subdomains: { id: string; label: string; keywords: string[] }[];
}

export interface TechWatchReport {
  id: string;
  domain_id: string;
  domain_label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  summary: string;
  key_findings: { subdomain: string; finding: string; importance: 'high' | 'medium' | 'low' }[];
  learning_impact: string;
  recommended_actions: { action: string; priority: 'high' | 'medium' | 'low' }[];
  source_urls?: string[];
  error?: string;
  triggered_at: string;
  completed_at: string;
}

export async function fetchDomains(): Promise<TechWatchDomain[]> {
  const r = await fetch(apiUrl('/api/techwatch/domains'));
  if (!r.ok) throw new Error('Failed to fetch domains');
  return r.json();
}

export async function fetchAllReports(): Promise<TechWatchReport[]> {
  const r = await fetch(apiUrl('/api/techwatch/reports'));
  if (!r.ok) return [];
  return r.json();
}

export async function fetchDomainReport(domainId: string): Promise<TechWatchReport | null> {
  const r = await fetch(apiUrl(`/api/techwatch/reports/${domainId}`));
  if (!r.ok) return null;
  return r.json();
}

function getProviderPayload(): string {
  const active = localStorage.getItem('API_ACTIVE_PROVIDER') || 'OPENROUTER';
  const apiKey = localStorage.getItem(`API_KEY_${active}`) || '';
  const model = localStorage.getItem(`API_MODEL_${active}`) || '';
  const baseUrl = localStorage.getItem(`API_URL_${active}`) || '';
  return JSON.stringify({ id: active, apiKey, model, baseUrl });
}

export async function scanDomain(domainId: string): Promise<any> {
  const r = await fetch(apiUrl(`/api/techwatch/scan/${domainId}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: getProviderPayload() }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => '');
    throw new Error(`Scan failed: ${err}`);
  }
  return r.json();
}

export async function scanAllDomains(): Promise<void> {
  await fetch(apiUrl('/api/techwatch/scan-all'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: getProviderPayload() }),
  });
}

export async function generateSynthesis(): Promise<{ synthesis: string; generatedAt: string }> {
  const r = await fetch(apiUrl('/api/techwatch/synthesis'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: getProviderPayload() }),
  });
  if (!r.ok) throw new Error('Synthesis failed');
  return r.json();
}
