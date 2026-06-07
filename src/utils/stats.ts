import { DayData } from '../data/initialData';
import { linearRegression, linearRegressionLine, sampleCorrelation } from 'simple-statistics';

/**
 * Calcule la régression linéaire pour projeter une valeur future (MRR ou clients)
 * @param history Tableau des données historiques
 * @param key La clé à analyser dans DayData
 * @param daysInFuture Jours dans le futur à projeter
 */
export const predictFutureValue = (history: DayData[], key: 'payingCustomers' | 'mrr', daysInFuture: number = 30): number => {
  if (history.length < 2) return 0;
  
  const points = history.map((d, index) => [index, key === 'payingCustomers' ? d.tech.payingCustomersDelta : d.tech.payingCustomersDelta * 99]); // Simplification MRR basé sur delta
  
  const regression = linearRegression(points);
  const predict = linearRegressionLine(regression);
  
  return predict(history.length + daysInFuture);
};

/**
 * Calcule la corrélation de Pearson entre score spirituel et productivité tech
 */
export const calculateProductivityCorrelation = (history: DayData[]): number => {
  if (history.length < 2) return 0;
  
  const spiritualScores = history.map(d => d.spiritual.score);
  const techTasks = history.map(d => d.tech.tasksCompleted);
  
  return sampleCorrelation(spiritualScores, techTasks);
};
