import type { ProgramState, DayData } from '../data/initialData';
import { generateId } from './chatService';
import { apiUrl } from './apiConfig';

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
  try {
    const response = await fetch(apiUrl('/api/briefing/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentDay: state.currentDay,
        currentSaaSPhase: state.currentSaaSPhase,
        mrr: state.mrr,
        payingCustomers: state.payingCustomers,
        booksFinished: state.books.filter(b => b.status === 'terminé').length,
        activeTasks: state.tasks.filter(t => t.status !== 'done').length,
        disciplineTrend: trend.trend,
        disciplineAvg: trend.avg,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { id: generateId(), day: state.currentDay, date: new Date().toISOString(), ...data, generatedAt: Date.now() };
  } catch {
    return null;
  }
}

export async function generateCoachInsight(state: ProgramState): Promise<CoachInsight | null> {
  const corr = computeCorrelation(state.days);
  const trend = computeDisciplineTrend(state.days);
  try {
    const response = await fetch(apiUrl('/api/insight/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentDay: state.currentDay,
        disciplineTrend: trend.trend,
        correlation: corr,
        mrr: state.mrr,
        payingCustomers: state.payingCustomers,
        englishStreak: state.englishStreak,
        sportStreak: state.sportStreak,
        prayerHours: state.currentDayInput.prayerHours,
        bibleChapters: state.currentDayInput.bibleChapters,
        englishMinutes: state.currentDayInput.englishMinutes,
        pushups: state.currentDayInput.sport.pushups,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { id: generateId(), correlation: corr, ...data };
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
