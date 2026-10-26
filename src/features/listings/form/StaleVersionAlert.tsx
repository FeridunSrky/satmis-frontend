import { useState } from 'react';
import { Button } from '@/shared/components/Button';

interface StaleVersionAlertProps {
  onReload: () => Promise<unknown>;
}

export function StaleVersionAlert({ onReload }: StaleVersionAlertProps) {
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await onReload();
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-md border-l-4 border-lane bg-lane/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium">
        İlan başka bir yerde güncellendi. Güncel hali yükleyip değişikliklerinizi tekrar yapın.
      </p>
      <Button variant="secondary" disabled={isReloading} onClick={() => void handleReload()}>
        {isReloading ? 'Yükleniyor...' : 'Güncel hali yükle'}
      </Button>
    </div>
  );
}
