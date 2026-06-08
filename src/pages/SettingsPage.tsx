import { useState, type ChangeEvent } from 'react';
import { Bell, CheckCircle2, Code2, Globe, Loader2, Moon, Sun, Wifi } from 'lucide-react';
import { InfoTile } from '../components/ui/InfoTile';
import { ModelSelector } from '../components/ModelSelector';
import { COMMAND_QUOTES } from '../utils/quotes';
import { testConnection } from '../services/aiClient';

type ThemeMode = 'dark' | 'light';

interface SettingsPageProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  providerConfig: Record<string, string>;
  onProviderConfig: (provider: string, field: 'URL' | 'KEY' | 'MODEL', value: string) => void;
  activeTasks: number;
  onSync: () => void;
  daysCount: number;
}

const PROVIDER_NAMES = ['GEMINI', 'DEEPSEEK', 'OPENROUTER', 'FIREWORKS'];

const PROVIDER_INFO: Record<string, { label: string; defaultModel: string }> = {
  GEMINI: { label: 'Gemini', defaultModel: 'gemini-pro' },
  DEEPSEEK: { label: 'DeepSeek', defaultModel: 'deepseek-v4-flash' },
  OPENROUTER: { label: 'OpenRouter', defaultModel: 'openai/gpt-4o' },
  FIREWORKS: { label: 'Fireworks', defaultModel: 'accounts/fireworks/models/llama-v3p1-8b-instruct' },
};

export function SettingsPage({
  theme, onThemeChange, providerConfig, onProviderConfig, activeTasks, onSync, daysCount,
}: SettingsPageProps) {
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [testing, setTesting] = useState<string | null>(null);

  const handleTest = async (provider: string) => {
    setTesting(provider);
    setTestResults(prev => ({ ...prev, [provider]: { ok: false, msg: 'Test en cours...' } }));
    try {
      const response = await testConnection(provider);
      setTestResults(prev => ({ ...prev, [provider]: { ok: true, msg: `✅ ${response}` } }));
    } catch (e) {
      setTestResults(prev => ({ ...prev, [provider]: { ok: false, msg: `❌ ${e instanceof Error ? e.message : 'Erreur'}` } }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <article className="card-glass space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Apparence</p>
            <h2 className="mt-2 font-syne text-2xl font-bold">Thème et session</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <button type="button" onClick={() => onThemeChange('dark')}
              className={`btn-secondary justify-center ${theme === 'dark' ? 'border-[var(--primary)] text-[var(--text)]' : ''}`}>
              <Moon className="h-4 w-4" /> Sombre
            </button>
            <button type="button" onClick={() => onThemeChange('light')}
              className={`btn-secondary justify-center ${theme === 'light' ? 'border-[var(--primary)] text-[var(--text)]' : ''}`}>
              <Sun className="h-4 w-4" /> Clair
            </button>
          </div>
          <button type="button" onClick={onSync} className="btn-primary w-full justify-center">
            <Wifi className="h-4 w-4" /> Forcer la sync
          </button>
        </article>

        <article className="card-glass space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Configuration IA</p>
            <h2 className="mt-2 font-syne text-2xl font-bold">Providers</h2>
          </div>
          {PROVIDER_NAMES.map(provider => {
            const info = PROVIDER_INFO[provider];
            return (
              <div key={provider} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{info.label}</p>
                  <button
                    onClick={() => handleTest(provider)}
                    disabled={testing === provider}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    {testing === provider ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Test
                  </button>
                </div>
                <input
                  value={providerConfig[`${provider}_URL`] ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onProviderConfig(provider, 'URL', e.target.value)}
                  placeholder="URL (ex: https://api.openai.com/...)"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                />
                <input
                  value={providerConfig[`${provider}_KEY`] ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onProviderConfig(provider, 'KEY', e.target.value)}
                  placeholder="Clé API"
                  type="password"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                />
                <ModelSelector
                  provider={provider}
                  value={providerConfig[`${provider}_MODEL`] ?? ''}
                  onChange={value => onProviderConfig(provider, 'MODEL', value)}
                  placeholder={`Modèle (défaut: ${info.defaultModel})`}
                />
                {testResults[provider] && (
                  <p className={`text-xs ${testResults[provider].ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {testResults[provider].msg}
                  </p>
                )}
              </div>
            );
          })}
        </article>
      </div>

      <div className="card-glass space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Résumé</p>
            <h3 className="mt-2 font-syne text-xl font-bold">État du dashboard</h3>
          </div>
          <Bell className="h-6 w-6 text-[var(--warning)]" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InfoTile label="Jours validés" value={daysCount} icon={CheckCircle2} />
          <InfoTile label="Tâches en cours" value={activeTasks} icon={Code2} />
          <InfoTile label="Mots-clés actifs" value={COMMAND_QUOTES.length} icon={Globe} />
        </div>
      </div>
    </section>
  );
}
