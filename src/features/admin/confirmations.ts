import type { ConfirmCopy } from '@/shared/components/ConfirmDialog';

export const APPROVE_CONFIRM: ConfirmCopy = {
  title: 'İlan onaylansın mı?',
  description: 'İlan hemen yayına girecek.',
  confirmLabel: 'Onayla',
  tone: 'primary',
};

export const UNBLOCK_CONFIRM: ConfirmCopy = {
  title: 'Engel kaldırılsın mı?',
  description: 'Kullanıcı tekrar giriş yapabilecek ve ilanları yeniden görünecek.',
  confirmLabel: 'Engeli kaldır',
  tone: 'primary',
};

export function catalogAddConfirm(name: string): ConfirmCopy {
  return {
    title: `${name} eklensin mi?`,
    description: 'Eklenen kayıt silinemez ve adı değiştirilemez.',
    confirmLabel: 'Ekle',
    tone: 'primary',
  };
}
