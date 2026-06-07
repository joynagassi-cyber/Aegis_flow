const BASE = import.meta.env.VITE_INSFORGE_API || 'http://localhost:3001/api';

// ---------- BOOKS ----------
export async function fetchBooks() {
  const r = await fetch(`${BASE}/books`);
  return r.json();
}
export async function saveBook(book: any) {
  const method = book.id ? 'PUT' : 'POST';
  const url = book.id ? `${BASE}/books/${book.id}` : `${BASE}/books`;
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
  return r.json();
}

// ---------- DAILY ----------
export async function fetchDailyData() {
  const r = await fetch(`${BASE}/daily`);
  return r.json();
}
export async function saveDaily(data: any) {
  const r = await fetch(`${BASE}/daily`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

// ---------- GEO‑AI ----------
export async function fetchRoadmap() {
  const r = await fetch(`${BASE}/geo/roadmaps`);
  return r.json();
}
export async function fetchMonths(roadmapId: number) {
  const r = await fetch(`${BASE}/geo/months/${roadmapId}`);
  return r.json();
}
export async function fetchWeeks(monthId: number) {
  const r = await fetch(`${BASE}/geo/weeks/${monthId}`);
  return r.json();
}
export async function fetchExercises(weekId: number) {
  const r = await fetch(`${BASE}/geo/exercises/${weekId}`);
  return r.json();
}
export async function updateExercise(ex: any) {
  const r = await fetch(`${BASE}/geo/exercises/${ex.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ex),
  });
  return r.json();
}

// ---------- IA ----------
export async function logAIRequest(payload: any) {
  const r = await fetch(`${BASE}/ai/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}
