import { useMemo } from 'react';
import { TrendingUp, DollarSign, Users } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DayData } from '../data/initialData';
import { computePredictions } from '../services/insightService';

interface PredictiveCardProps {
  days: DayData[];
}

export function PredictiveCard({ days }: PredictiveCardProps) {
  const predictions = useMemo(() => computePredictions(days), [days]);
  const hasData = days.length >= 2;

  const chartData = useMemo(() => {
    if (!hasData) return [];
    const recentDays = days.slice(0, 14).reverse();
    return [
      ...recentDays.map((d) => ({
        label: `J${d.dayNumber}`,
        clients: d.tech.payingCustomersDelta,
        mrr: d.tech.payingCustomersDelta * 99,
      })),
      { label: 'Aujourd\'hui', clients: null, mrr: null },
      ...predictions.days.map((d, i) => ({
        label: `J+${d}`,
        clients: predictions.customers[i],
        mrr: predictions.mrr[i],
        projected: true,
      })),
    ];
  }, [days, predictions, hasData]);

  return (
    <div className="card-glass">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--success)]/10 p-2">
            <TrendingUp className="h-5 w-5 text-[var(--success)]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Projection</p>
            <h3 className="font-syne text-lg font-bold text-[var(--text)]">Analyse prédictive</h3>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="mt-6 flex items-center justify-center py-12 text-sm text-[var(--text-muted)]">
          Valide au moins 2 jours pour activer les projections.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {predictions.days.map((d, i) => (
              <div key={d} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">J+{d}</p>
                <div className="mt-2 flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-[var(--success)]" />
                  <p className="text-lg font-bold text-[var(--success)]">{Math.round(predictions.mrr[i]).toLocaleString()}€</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <p className="text-sm font-bold text-[var(--accent)]">{Math.round(predictions.customers[i]).toLocaleString()} clients</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'var(--text)', fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-muted)' }} />
                <Line type="monotone" dataKey="mrr" stroke="#00E676" strokeWidth={2} dot={false} name="MRR (€)" />
                <Line type="monotone" dataKey="clients" stroke="#00B4FF" strokeWidth={2} dot={false} name="Clients" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
