import { type ButtonHTMLAttributes, type ElementType } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: ElementType;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function LoadingButton({
  loading = false,
  icon: Icon,
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  const baseClass =
    variant === 'primary' ? 'btn-primary' :
    variant === 'danger' ? 'btn-primary !bg-[var(--danger)] !shadow-none hover:!bg-[#D50000]' :
    'btn-secondary';

  return (
    <button
      className={`${baseClass} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {children}
    </button>
  );
}
