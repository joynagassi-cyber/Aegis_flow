import type { ProgramState, DayData } from '../data/initialData';
import { generateId } from './chatService';

export interface DailyBrief {
  id: string;
  day: number;
  date: string;
  summary: string;
  trend: string;
  urgentTasks: string;
  dailyGoal: string;
  quote: string;
  generatedAt: number;
}

export interface CoachInsight {
  id: string;
  insight: string;
  correlation: number;
  suggestion: string;
  severity: 'positive' | 'warning' | 'critical';
}

function loadConfig() {
  return {
    apiKey: localStorage.getItem('API_KEY_OPENROUTER') || '',
    apiUrl: localStorage.getItem('API_URL_OPENROUTER') || 'https://openrouter.ai/api/v1/chat/completions',
    model: localStorage.getItem('API_MODEL_OPENROUTER') || 'openai/gpt-4o-mini',
  };
}

async function callAI(system: string, user: string): Promise<string> {
  const { apiKey, apiUrl, model } = loadConfig();
  if (!apiKey) return '';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 600, temperature: 0.7 }),
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

export function computeDisciplineTrend(days: DayData[]): { avg: number; trend: 'up' | 'down' | 'stable'; deltas: number[] } {
  const recent = days.slice(0, 7).reverse();
  if (recent.length < 2) return { avg: 0, trend: 'stable', deltas: [] };

  const scores = recent.map(d => d.spiritual.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trend = secondAvg > firstAvg * 1.05 ? 'up' : secondAvg < firstAvg * 0.95 ? 'down' : 'stable';
  const deltas = scores.slice(1).map((v, i) => v - scores[i]);

  return { avg, trend, deltas };
}

export async function generateBrief(state: ProgramState): Promise<DailyBrief | null> {
  const trend = computeDisciplineTrend(state.days);
  const systemPrompt = `Tu es le commandant IA d'Aegis Flow. Génère un briefing quotidien en français, format JSON strict:
{
  "summary": "1 phrase sur la journée",
  "trend": "1 phrase sur la tendance discipline 7j (${trend.trend}, moyenne ${trend.avg})",
  "urgentTasks": "1 phrase rappel des tâches prioritaires si applicable",
  "dailyGoal": "1 objectif SMART pour aujourd'hui",
  "quote": "1 citation inspirante courte avec auteur"
}
Réponds UNIQUEMENT avec le JSON, sans backticks ni markdown.`;

  const userPrompt = `Jour J${state.currentDay}, Phase ${state.currentSaaSPhase}.
MRR: ${state.mrr}€, Clients: ${state.payingCustomers}, Livres terminés: ${state.books.filter(b => b.status === 'terminé').length}.
Tâches actives: ${state.tasks.filter(t => t.status !== 'done').length}.`;

  const raw = await callAI(systemPrompt, userPrompt);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return { id: generateId(), day: state.currentDay, date: new Date().toISOString(), ...parsed, generatedAt: Date.now() };
  } catch {
    return null;
  }
}

export async function generateCoachInsight(state: ProgramState): Promise<CoachInsight | null> {
  const corr = computeCorrelation(state.days);
  const systemPrompt = `Tu es le coach IA d'Aegis Flow. Analyse ces données et génère 1 insight corrélationnel en français, format JSON strict:
{
  "insight": "1 phrase clé reliant discipline et performance",
  "suggestion": "1 action concrète recommandée",
  "severity": "positive|warning|critical"
}
Corrélation calculée: ${corr.toFixed(2)} (0=nulle, 1=parfaite).
Réponds UNIQUEMENT JSON, sans backticks.`;

  const userPrompt = `Jour J${state.currentDay}. Tendance: ${computeDisciplineTrend(state.days).trend}.
MRR: ${state.mrr}€. Streak anglais: ${state.englishStreak}. Streak sport: ${state.sportStreak}.
Discipline actuelle: ${state.currentDayInput.prayerHours}h prière, ${state.currentDayInput.bibleChapters} chap bible, ${state.currentDayInput.englishMinutes}min anglais, ${state.currentDayInput.sport.pushups} pushups.`;

  const raw = await callAI(systemPrompt, userPrompt);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return { id: generateId(), correlation: corr, ...parsed };
  } catch {
    return null;
  }
}

export function computeCorrelation(days: DayData[]): number {
  if (days.length < 3) return 0;
  const recent = days.slice(0, 14);
  const spiritual = recent.map(d => d.spiritual.score);
  const customers = recent.map(d => d.tech.payingCustomersDelta);
  const sMean = spiritual.reduce((a, b) => a + b, 0) / spiritual.length;
  const cMean = customers.reduce((a, b) => a + b, 0) / customers.length;
  const num = spiritual.reduce((sum, s, i) => sum + (s - sMean) * (customers[i] - cMean), 0);
  const den1 = Math.sqrt(spiritual.reduce((sum, s) => sum + (s - sMean) ** 2, 0));
  const den2 = Math.sqrt(customers.reduce((sum, c) => sum + (c - cMean) ** 2, 0));
  return den1 && den2 ? num / (den1 * den2) : 0;
}

export function computePredictions(days: DayData[]): { days: number[]; mrr: number[]; customers: number[] } {
  if (days.length < 2) return { days: [30, 60, 90], mrr: [0, 0, 0], customers: [0, 0, 0] };

  const points = days.map((d, i) => [i, d.tech.payingCustomersDelta]);
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p[0], 0);
  const sumY = points.reduce((s, p) => s + p[1], 0);
  const sumXY = points.reduce((s, p) => s + p[0] * p[1], 0);
  const sumX2 = points.reduce((s, p) => s + p[0] * p[0], 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  const dailyDelta = Math.max(0, slope);
  const baseCustomers = days[days.length - 1]?.tech.payingCustomersDelta || 0;

  const futures = [30, 60, 90];
  const cumCustomers = futures.map(d => baseCustomers + dailyDelta * (n + d));
  const cumMrr = futures.map(d => (baseCustomers + dailyDelta * (n + d)) * 99);

  return { days: futures, mrr: cumMrr, customers: cumCustomers };
}
