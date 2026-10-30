import { authHttp, http } from '@/shared/api/http';
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
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

export async function verifyEmail(token: string): Promise<void> {
  const request: VerifyEmailRequest = { token };
  await authHttp.post('/auth/verify-email', request);
}

// Not an /auth endpoint: it needs the signed-in user, so it goes through the refreshing client
export async function resendVerificationEmail(): Promise<void> {
  await http.post('/users/me/email-verification');
}

export async function forgotPassword(email: string): Promise<void> {
  const request: ForgotPasswordRequest = { email };
  await authHttp.post('/auth/forgot-password', request);
}

export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
  await authHttp.post('/auth/reset-password', request);
}
