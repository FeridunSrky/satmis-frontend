import { http } from '@/shared/api/http';
import type { ChangePasswordRequest, UpdateProfileRequest, UserResponse } from '@/shared/api/types';

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await http.get<UserResponse>('/users/me');
  return response.data;
}

export async function updateCurrentUser(request: UpdateProfileRequest): Promise<UserResponse> {
  const response = await http.put<UserResponse>('/users/me', request);
  return response.data;
}

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  await http.put('/users/me/password', request);
}
