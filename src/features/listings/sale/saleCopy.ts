import type { CurrencyType } from '@/shared/api/enums';
import type { ConfirmCopy } from '@/shared/components/ConfirmDialog';
import { formatPrice } from '@/shared/lib/format';

export const SALE_PANEL_TITLE = 'Satıldı olarak işaretle';
export const SALE_PUBLIC_NOTICE =
  'Satış fiyatınız ve açıklamanız satılmış araçlar sayfasında satıcı bilgisi olmadan yayınlanır. İlan yayından kalkar; satış iptal olursa tekrar yayına alabilirsiniz.';
export const SALE_NOTE_HINT = 'Satılmış araçlar sayfasında herkese görünür.';
export const SOLD_MESSAGE = 'İlan satıldı olarak işaretlendi';
export const RELISTED_MESSAGE = 'İlan tekrar yayında';
export const STALE_LISTING_MESSAGE =
  'İlan başka bir işlemle güncellendi. Güncel hali yüklendi, lütfen tekrar deneyin.';
export const HIDDEN_SALE_WARNING =
  'Bu satış yönetici tarafından satılmış araçlar sayfasından kaldırıldı.';
export const SOLD_NOT_DELETABLE_HINT = 'Satılmış ilan silinemez; önce tekrar yayına alın.';

export function saleConfirm(salePrice: number, currency: CurrencyType): ConfirmCopy {
  return {
    title: 'İlan satıldı olarak işaretlensin mi?',
    description: `Satış fiyatı: ${formatPrice(salePrice, currency)}`,
    confirmLabel: 'Satışı kaydet',
    tone: 'primary',
  };
}

export const RELIST_CONFIRM: ConfirmCopy = {
  title: 'İlan tekrar yayına alınsın mı?',
  description:
    'Satış kaydı silinecek ve ilan tekrar yayına girecek. Satış fiyatı ve açıklaması satılmış araçlar sayfasından kalkar.',
  confirmLabel: 'Tekrar yayına al',
  tone: 'primary',
};
