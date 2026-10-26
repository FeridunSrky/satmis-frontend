import { cn } from '@/shared/lib/cn';

interface PlateMarkProps {
  text: string;
  size?: 'sm' | 'lg';
  className?: string;
}

/** Brand mark drawn as a Turkish licence plate: blue TR strip and condensed lettering. */
export function PlateMark({ text, size = 'sm', className }: PlateMarkProps) {
  const isLarge = size === 'lg';
  return (
    <span
      className={cn(
        'inline-flex items-stretch overflow-hidden border-ink bg-paper text-ink',
        isLarge
          ? 'rounded-xl border-[5px] shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)]'
          : 'rounded-md border-2',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex flex-col items-center justify-end bg-brand-600 font-display font-semibold text-white',
          isLarge ? 'w-10 pb-2 text-lg sm:w-14 sm:text-2xl' : 'w-5 pb-0.5 text-[0.55rem]',
        )}
      >
        TR
      </span>
      <span
        className={cn(
          'font-display leading-none font-bold',
          isLarge
            ? 'px-4 py-3 text-4xl tracking-[0.08em] sm:px-6 sm:text-6xl'
            : 'px-2 py-1 text-lg tracking-[0.06em]',
        )}
      >
        {toPlateText(text)}
      </span>
    </span>
  );
}

// Real plates only use the Latin alphabet, so "satmis" must read SATMIS, not the Turkish SATMİS
function toPlateText(text: string): string {
  return text.toLocaleUpperCase('en-US');
}
