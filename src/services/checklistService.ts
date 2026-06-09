import { apiUrl } from './apiConfig';

export async function fetchChecklistProgress(type: string, sectionId: string): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(apiUrl(`/api/checklists/${type}/${sectionId}`));
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function toggleChecklistItem(objectiveType: string, sectionId: string, itemId: string, done: boolean): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/checklists/toggle'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectiveType, sectionId, itemId, done }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveChecklistBatch(
  objectiveType: string,
  sectionId: string,
  items: { id: string; done: boolean }[]
): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/checklists/toggle-batch'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectiveType, sectionId, items }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
