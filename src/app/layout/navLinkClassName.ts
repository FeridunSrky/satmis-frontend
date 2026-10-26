import { cn } from '@/shared/lib/cn';

export function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-ink/5',
  );
}
