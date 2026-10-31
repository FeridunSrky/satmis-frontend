import type { ListingStatus } from '@/shared/api/enums';
import type { Role } from '@/shared/api/types';

/** A user as the admin list returns it; `enabled: false` means blocked. */
export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  enabled: boolean;
  emailVerified: boolean;
  /** ISO-8601 UTC. */
  createdAt: string;
  /** Listings in every state. */
  listingCount: number;
}

export interface AdminListingQuery {
  status: ListingStatus;
  page: number;
  size: number;
}

export interface AdminUserQuery {
  q?: string;
  page: number;
  size: number;
}

/** `version` is the one the admin reviewed, so unseen owner edits are never approved. */
export interface ApproveListingRequest {
  version: number;
}

export interface RejectListingRequest {
  version: number;
  /** Shown to the owner as written; at most 500 characters. */
  reason: string;
}

export interface CatalogNameRequest {
  name: string;
}
