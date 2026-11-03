import { useSearchParams } from 'react-router-dom';
import { MyCommentCard } from '@/features/comments/components/MyCommentCard';
import { useMyComments } from '@/features/comments/hooks/useCommentQueries';
import { ListingResults } from '@/features/listings/components/ListingResults';
import { buildPageHref, parsePageParam } from '@/features/listings/searchParams';
import { StateMessage } from '@/shared/components/StateMessage';

const MY_COMMENTS_PATH = '/yorumlarim';

export function MyCommentsPage() {
  const [searchParams] = useSearchParams();
  const page = parsePageParam(searchParams);
  const commentsQuery = useMyComments(page);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Yorumlarım</h1>
      <p className="mt-2 text-muted">
        İlanlara yazdığın yorumlar ve ilanlarına verdiğin cevaplar; onay durumlarıyla.
      </p>
      <div className="mt-8">
        <ListingResults
          query={commentsQuery}
          page={page}
          hrefForPage={(nextPage) => buildPageHref(MY_COMMENTS_PATH, searchParams, nextPage)}
          renderCard={(comment) => <MyCommentCard comment={comment} />}
          empty={<StateMessage title="Henüz yorum yazmadınız." />}
          errorTitle="Yorumlar yüklenemedi"
        />
      </div>
    </div>
  );
}
