export type Role = 'USER' | 'ADMIN';

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  /** Unverified users can sign in and browse but cannot create listings. */
  emailVerified: boolean;
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
  /** Only present when the frontend must react specially; see `ApiErrorCode`. */
  code?: string;
  message: string;
  path: string;
  errors?: Record<string, string>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
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
  phone: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Fixed paging contract shared by every list endpoint; `page` is zero-based. */
export interface PageResponse<TItem> {
  content: TItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CatalogItem {
  id: number;
  name: string;
}
