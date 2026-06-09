import { useState } from 'react';
import { authService } from '../services/authService';
import { LoadingButton } from './ui/LoadingButton';
import { Logo } from './Logo';

type AuthMode = 'login' | 'register';

export const AuthModal = ({ onSuccess }: { onSuccess: () => void }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Email et mot de passe requis'); return; }
    if (password.length < 6) { setError('Mot de passe : minimum 6 caractères'); return; }

    setLoading(true);
    try {
      if (mode === 'register') {
        await authService.signUp(email, password);
      } else {
        await authService.signInWithPassword(email, password);
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur Google Auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)]/95 backdrop-blur-xl p-4">
      <div className="card-glass w-full max-w-sm p-8 space-y-8 border border-[var(--border)] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <Logo size={32} />
          <div className="text-center">
            <h2 className="font-syne font-extrabold text-2xl text-[var(--text)] tracking-wider uppercase">Aegis Flow</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest font-bold">
              {mode === 'login' ? 'Connexion' : 'Création de compte'}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] transition shadow-inner text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] transition shadow-inner text-sm"
          />
          <LoadingButton
            onClick={handleSubmit}
            loading={loading}
            className="w-full !p-4 !text-sm"
          >
            {mode === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}
          </LoadingButton>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
            <span className="relative px-3 bg-[var(--surface)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">ou</span>
          </div>

          <LoadingButton
            onClick={handleGoogleLogin}
            loading={loading}
            variant="secondary"
            className="w-full !p-4 !text-sm"
          >
            CONNEXION GOOGLE
          </LoadingButton>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)]">
          {mode === 'login' ? (
            <>Pas encore de compte ?{' '}
              <button onClick={() => { setMode('register'); setError(''); }} className="text-[var(--primary)] underline font-bold">
                S'inscrire
              </button>
            </>
          ) : (
            <>Déjà un compte ?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="text-[var(--primary)] underline font-bold">
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
