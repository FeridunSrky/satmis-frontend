import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type { ListingImage } from '../types';
import { ListingImagePlaceholder } from './ListingImagePlaceholder';

interface ListingGalleryProps {
  images: ListingImage[];
  title: string;
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const orderedImages = [...images].sort(
    (first, second) => first.displayOrder - second.displayOrder,
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = orderedImages[selectedIndex] ?? orderedImages[0];

  if (!selectedImage) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-2xl">
        <ListingImagePlaceholder />
      </div>
    );
  }

  const imageCount = orderedImages.length;
  const showImage = (index: number) => setSelectedIndex((index + imageCount) % imageCount);

  return (
    <section aria-label="İlan görselleri">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-asphalt">
        <img
          src={selectedImage.url}
          alt={`${title}, görsel ${selectedIndex + 1} / ${imageCount}`}
          referrerPolicy="no-referrer"
          className="size-full object-contain"
        />
        {imageCount > 1 && (
          <>
            <GalleryArrow direction="previous" onClick={() => showImage(selectedIndex - 1)} />
            <GalleryArrow direction="next" onClick={() => showImage(selectedIndex + 1)} />
          </>
        )}
      </div>
      {imageCount > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {orderedImages.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                aria-label={`Görsel ${index + 1} / ${imageCount}`}
                aria-current={index === selectedIndex ? 'true' : undefined}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'block h-16 w-20 overflow-hidden rounded-md border-2',
                  index === selectedIndex ? 'border-brand-600' : 'border-transparent opacity-70',
                )}
              >
                <img
                  src={image.url}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface GalleryArrowProps {
  direction: 'previous' | 'next';
  onClick: () => void;
}

function GalleryArrow({ direction, onClick }: GalleryArrowProps) {
  const isPrevious = direction === 'previous';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrevious ? 'Önceki görsel' : 'Sonraki görsel'}
      className={cn(
        'absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-xl font-bold text-ink shadow hover:bg-paper',
        isPrevious ? 'left-3' : 'right-3',
      )}
    >
      <span aria-hidden="true">{isPrevious ? '‹' : '›'}</span>
    </button>
  );
}
