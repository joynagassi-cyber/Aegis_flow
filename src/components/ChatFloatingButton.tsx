import { Sparkles } from 'lucide-react';

interface ChatFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ChatFloatingButton({ onClick, isOpen }: ChatFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-110 active:scale-95 ${
        isOpen
          ? 'border-[var(--accent)]/60 bg-[var(--accent)]/20 shadow-[var(--accent)]/20'
          : 'border-white/20 bg-white/10 hover:bg-white/20'
      }`}
      style={{
        boxShadow: isOpen
          ? '0 0 30px rgba(0, 180, 255, 0.3), inset 0 0 20px rgba(0, 180, 255, 0.05)'
          : '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
      aria-label="IA Chat"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-transparent" />
      <Sparkles
        className={`relative h-6 w-6 transition-all duration-300 ${isOpen ? 'text-[var(--accent)] rotate-12' : 'text-white/80'}`}
        fill={isOpen ? 'var(--accent)' : 'none'}
        fillOpacity={isOpen ? 0.3 : 0}
      />
    </button>
  );
}
