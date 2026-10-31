import type { useListingImages } from '../hooks/useListingImages';
import { MAX_IMAGES } from '../listingLimits';
import { FormSection } from './FormSection';
import { ImagePicker } from './ImagePicker';
import { ImageThumbnail } from './ImageThumbnail';

interface ListingImagesSectionProps {
  images: ReturnType<typeof useListingImages>;
  error?: string;
}

export function ListingImagesSection({ images, error }: ListingImagesSectionProps) {
  const { items } = images;

  return (
    <FormSection
      title="Görseller"
      description="Fotoğrafları seçtiğiniz anda yüklenir; ilk görsel kapak olur. Konum bilgisi yüklemeden önce silinir."
    >
      <div className="sm:col-span-2">
        <ImagePicker onFiles={images.addFiles} disabled={items.length >= MAX_IMAGES} />
        <p className="mt-2 text-sm text-muted">
          {items.length}/{MAX_IMAGES} görsel
        </p>
      </div>
      {items.length > 0 && (
        <ol className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
          {items.map((item, index) => (
            <ImageThumbnail
              key={item.key}
              item={item}
              position={index + 1}
              count={items.length}
              onMove={(offset) => images.moveImage(item.key, offset)}
              onMakeCover={() => images.makeCover(item.key)}
              onRemove={() => images.removeImage(item.key)}
            />
          ))}
        </ol>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
          {error}
        </p>
      )}
    </FormSection>
  );
}
