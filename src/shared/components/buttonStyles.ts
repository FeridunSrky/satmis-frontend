import { cn } from '@/shared/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'onDark';
type ButtonSize = 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary: 'border border-line bg-paper text-ink hover:border-ink/40',
  ghost: 'text-ink hover:bg-ink/5',
  onDark: 'border border-white/30 text-white hover:border-white hover:bg-white/5',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: ButtonStyleOptions = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap',
    'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
  );
}
