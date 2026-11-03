import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getCommentQuota, getListingComments, getMyComments } from '../api/commentsApi';
import { commentKeys } from '../commentKeys';

const LISTING_COMMENTS_PAGE_SIZE = 10;
const MY_COMMENTS_PAGE_SIZE = 20;

/** Approved comments, newest first, loaded a page at a time with "Daha fazla yorum". */
export function useListingComments(listingId: number) {
  return useInfiniteQuery({
    queryKey: commentKeys.listing(listingId),
    queryFn: ({ pageParam }) =>
      getListingComments(listingId, { page: pageParam, size: LISTING_COMMENTS_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

/** `page` is one-based, as in the URL. */
export function useMyComments(page: number) {
  return useQuery({
    queryKey: commentKeys.mine(page),
    queryFn: () => getMyComments({ page: page - 1, size: MY_COMMENTS_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}

export function useCommentQuota(listingId: number) {
  return useQuery({
    queryKey: commentKeys.quota(listingId),
    queryFn: () => getCommentQuota(listingId),
  });
}
