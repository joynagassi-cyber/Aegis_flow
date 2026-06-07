import { useState } from 'react';
import { authService } from '../services/authService';

export const AuthModal = ({ onSuccess }: { onSuccess: () => void }) => {
  const [email, setEmail] = useState('');

  const handleEmailLogin = async () => {
    try {
      await authService.signInWithEmail(email);
      onSuccess();
    } catch (e) {
      console.error("Auth error", e);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authService.signInWithGoogle();
      onSuccess();
    } catch (e) {
      console.error("Google Auth error", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)]/95 backdrop-blur-xl p-4 selection:bg-[var(--primary)]/30">
      <div className="command-card w-full max-w-sm p-8 space-y-8 border border-[var(--border)] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--primary)]/30 shadow-lg">
            <img src="/assets/aegis-flow.png" alt="Aegis Flow" className="w-8 h-8 object-contain" />
          </div>
          <div className="text-center">
            <h2 className="font-syne font-extrabold text-2xl text-[var(--text)] tracking-wider uppercase">Aegis Flow</h2>
            <p className="font-body text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest font-bold">Command Access</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="identifiant@titan.com" 
            className="w-full p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] transition shadow-inner font-mono-num text-sm"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button 
            onClick={handleEmailLogin} 
            className="w-full bg-[var(--primary)] text-white p-4 rounded-xl font-body font-bold text-sm shadow-md hover:shadow-[var(--primary)]/20 transition cursor-pointer"
          >
            CONTINUER PAR EMAIL
          </button>
          
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
            <span className="relative px-3 bg-[var(--surface)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">ou</span>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] p-4 rounded-xl font-body font-bold text-sm hover:bg-[var(--surface-3)] transition cursor-pointer shadow-sm"
          >
            CONNEXION GOOGLE
          </button>
        </div>
        
        <p className="text-[10px] text-center text-[var(--text-muted)] font-body font-medium leading-relaxed">
          Accès sécurisé pour le Command Center. <br />
          Toute activité est loggée pour la conformité Alpha.
        </p>
      </div>
    </div>
  );
};
