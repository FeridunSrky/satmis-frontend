import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { formatPhone } from '@/shared/lib/format';
import { buildLoginPath } from '@/shared/lib/safeRedirect';

interface SellerPhoneProps {
  listingId: number;
  phone: string | null;
}

const linkClassName = 'font-semibold text-brand-700 underline-offset-2 hover:underline';

export function SellerPhone({ listingId, phone }: SellerPhoneProps) {
  const isSignedIn = useAuthStore((state) => state.status === 'authenticated');

  if (phone) {
    return (
      <a href={`tel:${phone}`} className={linkClassName}>
        {formatPhone(phone)}
      </a>
    );
  }
  // The backend hides numbers from anonymous visitors to make scraping harder
  if (!isSignedIn) {
    return (
      <Link to={buildLoginPath(`/ilan/${listingId}`)} className={linkClassName}>
        Numarayı görmek için giriş yapın
      </Link>
    );
  }
  return <span className="text-muted">Satıcı telefon numarası eklememiş</span>;
}
