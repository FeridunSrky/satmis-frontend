import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useAdminActionErrorHandler } from '../adminErrors';
import { useBlockUser, useUnblockUser } from '../hooks/useAdminUsers';
import type { AdminUser } from '../types';

interface UserStatusActionProps {
  user: Pick<AdminUser, 'id' | 'email' | 'role' | 'enabled'>;
}

/** Block or unblock; admins cannot be blocked, so they get no button (the backend says 422). */
export function UserStatusAction({ user }: UserStatusActionProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const handleError = useAdminActionErrorHandler();

  if (user.role === 'ADMIN') {
    return null;
  }

  const handleBlock = async () => {
    try {
      await block.mutateAsync(user.id);
      toast.success('Kullanıcı engellendi');
    } catch (error) {
      handleError(error);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleUnblock = async () => {
    try {
      await unblock.mutateAsync(user.id);
      toast.success('Kullanıcının engeli kaldırıldı');
    } catch (error) {
      handleError(error);
    }
  };

  if (!user.enabled) {
    return (
      <Button variant="secondary" disabled={unblock.isPending} onClick={() => void handleUnblock()}>
        Engeli kaldır
      </Button>
    );
  }
  return (
    <>
      <Button
        variant="ghost"
        className="text-danger hover:bg-danger-soft"
        onClick={() => setIsConfirmOpen(true)}
      >
        Engelle
      </Button>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`${user.email} engellensin mi?`}
        description="Kullanıcının oturumları kapanacak ve ilanları gizlenecek."
        confirmLabel="Engelle"
        isConfirming={block.isPending}
        onConfirm={() => void handleBlock()}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
