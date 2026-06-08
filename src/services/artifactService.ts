import { apiUrl } from './apiConfig';
import type { Artifact } from './chatService';

export interface ArtifactRecord {
  id: string;
  session_id: string;
  title: string;
  type: string;
  content: string;
  language: string | null;
  source_message_id: string | null;
  created_at: string;
}

export interface ArtifactTypeCount {
  type: string;
  count: number;
}

export interface ArtifactSession {
  session_id: string;
  count: number;
  last_artifact: string;
}

function mapRecord(r: ArtifactRecord): ArtifactRecord & { type: Artifact['type'] } {
  return { ...r, type: r.type as Artifact['type'] };
}

export async function saveArtifact(artifact: {
  session_id?: string;
  title: string;
  type: string;
  content: string;
  language?: string;
  source_message_id?: string;
}): Promise<ArtifactRecord> {
  const res = await fetch(apiUrl('/api/artifacts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(artifact),
  });
  if (!res.ok) throw new Error(`Save artifact failed: ${res.status}`);
  return mapRecord(await res.json());
}

export async function saveArtifactsBatch(artifacts: {
  session_id?: string;
  title: string;
  type: string;
  content: string;
  language?: string;
  source_message_id?: string;
}[]): Promise<ArtifactRecord[]> {
  if (artifacts.length === 0) return [];
  const res = await fetch(apiUrl('/api/artifacts/batch'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artifacts }),
  });
  if (!res.ok) throw new Error(`Batch save failed: ${res.status}`);
  const data = await res.json();
  return data.map(mapRecord);
}

export async function listArtifacts(params?: {
  type?: string;
  session_id?: string;
  limit?: number;
  offset?: number;
}): Promise<ArtifactRecord[]> {
  const search = new URLSearchParams();
  if (params?.type) search.set('type', params.type);
  if (params?.session_id) search.set('session_id', params.session_id);
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));
  const res = await fetch(apiUrl(`/api/artifacts?${search}`));
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(mapRecord);
}

export async function getArtifactTypes(): Promise<ArtifactTypeCount[]> {
  const res = await fetch(apiUrl('/api/artifacts/types'));
  if (!res.ok) return [];
  return res.json();
}

export async function getArtifactSessions(): Promise<ArtifactSession[]> {
  const res = await fetch(apiUrl('/api/artifacts/sessions'));
  if (!res.ok) return [];
  return res.json();
}

export async function deleteArtifact(id: string): Promise<void> {
  await fetch(apiUrl(`/api/artifacts/${id}`), { method: 'DELETE' });
}
