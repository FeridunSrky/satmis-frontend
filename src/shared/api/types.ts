export type Role = 'USER' | 'ADMIN';

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: UserResponse;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  message: string;
  path: string;
  errors?: Record<string, string>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
