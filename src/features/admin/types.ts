import type { ListingSummary } from '@/features/listings/types';
import type { ListingStatus, ReportReason, ReportStatus } from '@/shared/api/enums';
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

/** A listing with open reports, as the report queue returns it. */
export interface ReportedListing {
  /** Its current state: a passive or hidden listing is still listed. */
  listing: ListingSummary;
  openReportCount: number;
  /** Open reports per reason; reasons nobody chose are left out. */
  reasons: Partial<Record<ReportReason, number>>;
  /** ISO-8601 UTC. */
  firstReportedAt: string;
  /** ISO-8601 UTC. */
  lastReportedAt: string;
}

export interface AdminListingReport {
  id: number;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reporter: { id: number; firstName: string; lastName: string; email: string };
  /** ISO-8601 UTC. */
  createdAt: string;
  /** ISO-8601 UTC; null while the report is open. */
  resolvedAt: string | null;
}

export interface PageRequest {
  page: number;
  size: number;
}
