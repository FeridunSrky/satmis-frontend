import { http } from '@/shared/api/http';
import type { PageResponse } from '@/shared/api/types';
import type { AdminUser, AdminUserQuery } from '../types';

export async function getAdminUsers(query: AdminUserQuery): Promise<PageResponse<AdminUser>> {
  const response = await http.get<PageResponse<AdminUser>>('/admin/users', { params: query });
  return response.data;
}

export async function blockUser(userId: number): Promise<void> {
  await http.post(`/admin/users/${userId}/block`);
}

export async function unblockUser(userId: number): Promise<void> {
  await http.post(`/admin/users/${userId}/unblock`);
}
