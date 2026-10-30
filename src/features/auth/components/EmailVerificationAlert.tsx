import { ResendVerificationButton } from './ResendVerificationButton';

/** Shown where an action was refused with `EMAIL_NOT_VERIFIED`, e.g. above the listing form. */
export function EmailVerificationAlert() {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border-l-4 border-lane bg-lane/15 px-4 py-3 text-sm"
    >
      <p className="font-medium">
        İlan vermek için e-posta adresini doğrula. Linki bulamıyorsan yenisini gönderebiliriz.
      </p>
      <ResendVerificationButton />
    </div>
  );
}
