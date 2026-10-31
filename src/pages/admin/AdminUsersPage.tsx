import { useSearchParams } from 'react-router-dom';
import { AdminQueryError } from '@/features/admin/components/AdminQueryError';
import { UsersTable } from '@/features/admin/components/UsersTable';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import {
  MAX_USER_SEARCH_LENGTH,
  parseUserSearch,
  toUserSearchParams,
} from '@/features/admin/userSearchParams';
import { buildPageHref, parsePageParam } from '@/features/listings/searchParams';
import { toApiError } from '@/shared/api/apiError';
import { Pagination } from '@/shared/components/Pagination';
import { SearchForm } from '@/shared/components/SearchForm';
import { StateMessage } from '@/shared/components/StateMessage';

const USERS_PATH = '/admin/kullanicilar';

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = parseUserSearch(searchParams);
  const page = parsePageParam(searchParams);
  const usersQuery = useAdminUsers(searchText, page);
  const searchError = usersQuery.isError ? searchErrorOf(usersQuery.error) : undefined;

  return (
    <section aria-labelledby="admin-users-title">
      <h2 id="admin-users-title" className="font-display text-3xl font-bold">
        Kullanıcılar
      </h2>
      <SearchForm
        className="mt-4 max-w-xl"
        label="E-posta ile kullanıcı ara"
        placeholder="E-posta adresi ya da bir parçası"
        maxLength={MAX_USER_SEARCH_LENGTH}
        keyword={searchText}
        onSearch={(nextSearch) => setSearchParams(toUserSearchParams(nextSearch))}
        serverError={searchError}
      />
      <div className="mt-6">
        <UsersContent
          query={usersQuery}
          searchText={searchText}
          page={page}
          hrefForPage={(nextPage) => buildPageHref(USERS_PATH, searchParams, nextPage)}
        />
      </div>
    </section>
  );
}

interface UsersContentProps {
  query: ReturnType<typeof useAdminUsers>;
  searchText: string | undefined;
  page: number;
  hrefForPage: (page: number) => string;
}

function UsersContent({ query, searchText, page, hrefForPage }: UsersContentProps) {
  if (query.isPending) {
    return <output className="block text-muted">Kullanıcılar yükleniyor...</output>;
  }
  if (query.isError) {
    return (
      <AdminQueryError
        error={query.error}
        title="Kullanıcılar yüklenemedi"
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (query.data.content.length === 0) {
    return (
      <StateMessage
        title={searchText ? `“${searchText}” ile eşleşen kullanıcı yok.` : 'Henüz kullanıcı yok.'}
      />
    );
  }
  return (
    <div aria-busy={query.isFetching}>
      <UsersTable users={query.data.content} />
      <Pagination page={page} totalPages={query.data.totalPages} hrefForPage={hrefForPage} />
    </div>
  );
}

function searchErrorOf(error: unknown): string | undefined {
  const apiError = toApiError(error);
  return apiError.kind === 'http' ? apiError.fieldErrors.q : undefined;
}
