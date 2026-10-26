export function ListingImagePlaceholder() {
  return (
    <div className="relative flex size-full items-center justify-center bg-asphalt text-sm font-semibold text-white/70">
      Görsel yok
      <span aria-hidden="true" className="lane-dashes absolute inset-x-0 bottom-4 h-1 opacity-70" />
    </div>
  );
}
