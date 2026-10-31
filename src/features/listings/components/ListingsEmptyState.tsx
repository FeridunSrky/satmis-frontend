import { Button } from '@/shared/components/Button';
import { StateMessage } from '@/shared/components/StateMessage';

interface ListingsEmptyStateProps {
  keyword?: string;
  activeFilterCount: number;
  onClearKeyword: () => void;
  onClearAll: () => void;
}

export function ListingsEmptyState({
  keyword,
  activeFilterCount,
  onClearKeyword,
  onClearAll,
}: ListingsEmptyStateProps) {
  const hasFilters = activeFilterCount > 0;

  if (!keyword) {
    return (
      <StateMessage
        title="Aramanıza uygun ilan bulunamadı"
        description="Filtreleri gevşetmeyi ya da farklı bir kasa tipi seçmeyi deneyin."
      >
        {hasFilters && <Button onClick={onClearAll}>Filtreleri temizle</Button>}
      </StateMessage>
    );
  }
  return (
    <StateMessage
      title={`“${keyword}” için ilan bulunamadı.`}
      description="Farklı kelimelerle aramayı ya da filtreleri gevşetmeyi deneyin."
    >
      {hasFilters ? (
        <Button onClick={onClearAll}>Aramayı ve filtreleri temizle</Button>
      ) : (
        <Button onClick={onClearKeyword}>Aramayı temizle</Button>
      )}
    </StateMessage>
  );
}
