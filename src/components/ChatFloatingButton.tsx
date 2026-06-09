import { Sparkles } from 'lucide-react';

interface ChatFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ChatFloatingButton({ onClick, isOpen }: ChatFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl border-2 transition-all duration-300 hover:scale-110 active:scale-95 ${
        isOpen
          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
      }`}
      aria-label="IA Chat"
    >
      <Sparkles
        className={`h-6 w-6 transition-all duration-300 ${isOpen ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
      />
    </button>
  );
}
