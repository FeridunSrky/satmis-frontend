import type { UserResponse } from '@/shared/api/types';

export function getInitials({ firstName, lastName }: Pick<UserResponse, 'firstName' | 'lastName'>) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toLocaleUpperCase('tr-TR');
}
