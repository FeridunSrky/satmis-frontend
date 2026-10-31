import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { hasStatus, toApiError } from '@/shared/api/apiError';

export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
export const HTTP_UNPROCESSABLE = 422;

/**
 * Handles a failed admin action the same way everywhere: a 403 leaves the admin section,
 * anything else shows the backend message.
 */
export function useAdminActionErrorHandler() {
  const navigate = useNavigate();
  return (error: unknown) => {
    if (hasStatus(error, HTTP_FORBIDDEN)) {
      void navigate('/', { replace: true });
      return;
    }
    toast.error(toApiError(error).message);
  };
}
