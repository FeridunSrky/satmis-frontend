import type { AuthResponse, ErrorResponse, UserResponse } from '@/shared/api/types';

export const testUser: UserResponse = {
  id: 1,
  email: 'ayse@example.com',
  firstName: 'Ayşe',
  lastName: 'Yılmaz',
  phone: null,
  role: 'USER',
};

export function buildAuthResponse(generation: number, user = testUser): AuthResponse {
  return {
    accessToken: `access-${generation}`,
    refreshToken: `refresh-${generation}`,
    tokenType: 'Bearer',
    expiresInSeconds: 900,
    user,
  };
}

export function buildErrorResponse(
  status: number,
  message: string,
  errors?: Record<string, string>,
): ErrorResponse {
  return { timestamp: new Date().toISOString(), status, message, path: '/api/test', errors };
}
