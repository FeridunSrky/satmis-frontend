export function FullPageLoader() {
  return (
    <output className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <span className="lane-dashes h-1 w-32 animate-pulse rounded" aria-hidden="true" />
      <span className="text-sm font-medium text-muted">Yükleniyor...</span>
    </output>
  );
}
