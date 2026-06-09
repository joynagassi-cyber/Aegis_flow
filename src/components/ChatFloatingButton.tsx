import { Sparkles } from 'lucide-react';

interface ChatFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ChatFloatingButton({ onClick, isOpen }: ChatFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-[14px] border-2 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
        isOpen
          ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_20px_var(--primary-glow)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-2)]'
      }`}
      aria-label="IA Chat"
    >
      <Sparkles
        className={`h-5 w-5 transition-all duration-300 ${isOpen ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--primary)]'}`}
      />
    </button>
  );
}
