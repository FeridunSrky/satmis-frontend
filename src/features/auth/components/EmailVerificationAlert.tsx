import { ResendVerificationButton } from './ResendVerificationButton';

const LISTING_MESSAGE =
  'İlan vermek için e-posta adresini doğrula. Linki bulamıyorsan yenisini gönderebiliriz.';

/** Shown where an action was refused with `EMAIL_NOT_VERIFIED`, e.g. above the listing form. */
export function EmailVerificationAlert({ message = LISTING_MESSAGE }: { message?: string }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border-l-4 border-lane bg-lane/15 px-4 py-3 text-sm"
    >
      <p className="font-medium">{message}</p>
      <ResendVerificationButton />
    </div>
  );
}
