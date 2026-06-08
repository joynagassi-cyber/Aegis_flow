import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildValidatedDay, isDayValid, emptyDailyInput } from '../utils/helpers';
import { getCurrentPhase, getPhaseProgress } from '../data/saasObjectives';
import { computeCorrelation, computePredictions, computeDisciplineTrend } from '../services/insightService';
import type { ProgramState, DayData } from '../data/initialData';
import { getInitialState } from '../data/initialData';

function makeState(overrides?: Partial<ProgramState>): ProgramState {
  return { ...getInitialState(), ...overrides };
}

describe('Validation quotidienne', () => {
  describe('isDayValid', () => {
    it('returns false for empty input', () => {
      const state = makeState();
      expect(isDayValid(state)).toBe(false);
    });

    it('returns true when prayer > 0', () => {
      const state = makeState();
      state.currentDayInput.prayerHours = 1;
      expect(isDayValid(state)).toBe(true);
    });

    it('returns true when pushups > 0', () => {
      const state = makeState();
      state.currentDayInput.sport.pushups = 10;
      expect(isDayValid(state)).toBe(true);
    });

    it('returns true when reading checklist is true', () => {
      const state = makeState();
      state.dailyChecklist.reading = true;
      expect(isDayValid(state)).toBe(true);
    });
  });

  describe('buildValidatedDay', () => {
    it('computes spiritual score correctly', () => {
      const state = makeState();
      state.currentDayInput.prayerHours = 3;
      state.currentDayInput.bibleChapters = 20;
      state.currentDayInput.fasting = true;
      const day = buildValidatedDay(state);
      const expectedScore = Math.min(100, Math.round((3 / 6) * 45 + (20 / 40) * 35 + 20));
      expect(day.spiritual.score).toBe(expectedScore);
    });

    it('computes tech delta correctly', () => {
      const state = makeState();
      state.currentDayInput.techTasksCount = 5;
      const day = buildValidatedDay(state);
      expect(day.tech.payingCustomersDelta).toBe(70);
    });

    it('marks english completed when >= 45 minutes', () => {
      const state = makeState();
      state.currentDayInput.englishMinutes = 45;
      const day = buildValidatedDay(state);
      expect(day.english.completed).toBe(true);
    });

    it('reads english minutes from input', () => {
      const state = makeState();
      state.currentDayInput.englishMinutes = 30;
      const day = buildValidatedDay(state);
      expect(day.english.minutes).toBe(30);
      expect(day.english.completed).toBe(false);
    });

    it('check validatation flag with pushups met', () => {
      const state = makeState();
      state.currentDayInput.sport.pushups = 999;
      const day = buildValidatedDay(state);
      expect(day.validated).toBe(true);
    });

    it('check validates when reading completed', () => {
      const state = makeState();
      state.dailyChecklist.reading = true;
      const day = buildValidatedDay(state);
      expect(day.validated).toBe(true);
    });

    it('does not valid if all checklist and input empty', () => {
      const state = makeState();
      const day = buildValidatedDay(state);
      expect(day.validated).toBe(false);
    });

    it('stores books finished count', () => {
      const state = makeState();
      state.books.push(
        { id: '1', title: 'B1', status: 'terminé' },
        { id: '2', title: 'B2', status: 'en_cours' },
        { id: '3', title: 'B3', status: 'terminé' },
      );
      const day = buildValidatedDay(state);
      expect(day.reading.booksFinishedCount).toBe(2);
    });
  });
});

describe('Phases SaaS', () => {
  describe('getCurrentPhase', () => {
    it('returns MVP for day 1', () => {
      const phase = getCurrentPhase(1);
      expect(phase.id).toBe('mvp');
      expect(phase.label).toBe('MVP');
    });

    it('returns Développement for day 45', () => {
      const phase = getCurrentPhase(45);
      expect(phase.id).toBe('developpement');
    });

    it('returns Premier Paiement for day 75', () => {
      const phase = getCurrentPhase(75);
      expect(phase.id).toBe('premier-paiement');
    });

    it('returns Lancement for day 100', () => {
      const phase = getCurrentPhase(100);
      expect(phase.id).toBe('lancement');
    });

    it('returns Itérations for day 200', () => {
      const phase = getCurrentPhase(200);
      expect(phase.id).toBe('iterations');
    });
  });

  describe('getPhaseProgress', () => {
    it('returns 0 at phase start', () => {
      const phase = getCurrentPhase(1);
      expect(getPhaseProgress(1, phase)).toBe(0);
    });

    it('returns 48 at midpoint (14/29)', () => {
      const phase = getCurrentPhase(15);
      expect(getPhaseProgress(15, phase)).toBe(48);
    });

    it('returns 100 at phase end', () => {
      const phase = getCurrentPhase(30);
      expect(getPhaseProgress(30, phase)).toBe(100);
    });
  });
});

describe('Fonctions analytiques (insightService)', () => {
  describe('computeDisciplineTrend', () => {
    it('returns stable for less than 2 days', () => {
      const days = [{ dayNumber: 1, spiritual: { score: 50 } }] as DayData[];
      const result = computeDisciplineTrend(days);
      expect(result.trend).toBe('stable');
    });

    it('detects upward trend (recent > older)', () => {
      const days = Array.from({ length: 7 }, (_, i) => ({
        dayNumber: 7 - i,
        spiritual: { score: 90 - i * 10 },
      })) as DayData[];
      const result = computeDisciplineTrend(days);
      expect(result.trend).toBe('up');
    });

    it('detects downward trend (recent < older)', () => {
      const days = Array.from({ length: 7 }, (_, i) => ({
        dayNumber: 7 - i,
        spiritual: { score: 30 + i * 10 },
      })) as DayData[];
      const result = computeDisciplineTrend(days);
      expect(result.trend).toBe('down');
    });
  });

  describe('computeCorrelation', () => {
    it('returns 0 for less than 3 days', () => {
      const days = [
        { spiritual: { score: 50 }, tech: { payingCustomersDelta: 10 } },
        { spiritual: { score: 60 }, tech: { payingCustomersDelta: 15 } },
      ] as DayData[];
      expect(computeCorrelation(days)).toBe(0);
    });

    it('returns positive correlation when discipline and performance align', () => {
      const days = Array.from({ length: 14 }, (_, i) => ({
        spiritual: { score: 40 + i * 3 },
        tech: { payingCustomersDelta: 5 + i * 2 },
      })) as DayData[];
      const corr = computeCorrelation(days);
      expect(corr).toBeGreaterThan(0);
    });
  });

  describe('computePredictions', () => {
    it('returns zeros for less than 2 days', () => {
      const days = [{ tech: { payingCustomersDelta: 10 } }] as DayData[];
      const pred = computePredictions(days);
      expect(pred.mrr).toEqual([0, 0, 0]);
      expect(pred.customers).toEqual([0, 0, 0]);
    });

    it('projects positive growth', () => {
      const days = Array.from({ length: 10 }, (_, i) => ({
        tech: { payingCustomersDelta: 10 + i * 5 },
      })) as DayData[];
      const pred = computePredictions(days);
      expect(pred.customers[0]).toBeGreaterThan(0);
      expect(pred.mrr[0]).toBeGreaterThan(0);
    });
  });
});
