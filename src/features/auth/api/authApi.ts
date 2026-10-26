import { authHttp } from '@/shared/api/http';
import type {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RegisterRequest,
} from '@/shared/api/types';

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await authHttp.post<AuthResponse>('/auth/login', request);
  return response.data;
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const response = await authHttp.post<AuthResponse>('/auth/register', request);
  return response.data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const request: RefreshRequest = { refreshToken };
  const response = await authHttp.post<AuthResponse>('/auth/refresh', request);
  return response.data;
}

export async function logout(refreshToken: string): Promise<void> {
  const request: LogoutRequest = { refreshToken };
  await authHttp.post('/auth/logout', request);
}
