import { Navigate } from 'react-router-dom';
import { hasStatus, toApiError } from '@/shared/api/apiError';
import { Button } from '@/shared/components/Button';
import { StateMessage } from '@/shared/components/StateMessage';
import { HTTP_FORBIDDEN } from '../adminErrors';

interface AdminQueryErrorProps {
  error: unknown;
  title: string;
  onRetry: () => void;
}

/** Error state of an admin fetch; a 403 means the role was taken away, so leave the section. */
export function AdminQueryError({ error, title, onRetry }: AdminQueryErrorProps) {
  if (hasStatus(error, HTTP_FORBIDDEN)) {
    return <Navigate to="/" replace />;
  }
  return (
    <StateMessage tone="error" title={title} description={toApiError(error).message}>
      <Button variant="secondary" onClick={onRetry}>
        Tekrar dene
      </Button>
    </StateMessage>
  );
}
