import type { CommentFormCopy } from './components/CommentForm';

export const COMMENT_FORM_COPY: CommentFormCopy = {
  label: 'Yorumunuz',
  submitLabel: 'Gönder',
  confirm: {
    title: 'Yorumu gönder',
    description:
      'Yorumunuz incelendikten sonra yayınlanacak. Yorumlar düzenlenemez; silerseniz hakkınız geri gelmez. Gönderilsin mi?',
    confirmLabel: 'Gönder',
    tone: 'primary',
  },
};

export const REPLY_FORM_COPY: CommentFormCopy = {
  label: 'Cevabınız',
  submitLabel: 'Cevabı gönder',
  confirm: {
    title: 'Cevabı gönder',
    description:
      'Cevabınız incelendikten sonra yayınlanacak. Cevaplar düzenlenemez; silerseniz cevap hakkınız geri gelmez. Gönderilsin mi?',
    confirmLabel: 'Gönder',
    tone: 'primary',
  },
};

export const COMMENTS_INTRO =
  'Yorumlar yayınlanmadan önce incelenir. Aracı gördüyseniz deneyiminizi ve varsa ekspertiz raporunu paylaşabilirsiniz.';
