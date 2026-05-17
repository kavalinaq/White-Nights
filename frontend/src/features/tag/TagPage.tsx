import {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useTagPosts} from './hooks/useTagPosts';
import {PostCard} from '../../shared/components/PostCard';
import {ReportModal} from '../moderation/ReportModal';

export function TagPage() {
  const {t} = useTranslation();
  const { name } = useParams<{ name: string }>();
  const tagName = name ?? '';
  const { items, hasMore, loadMore, isLoading, isFetching } = useTagPosts(tagName);
  const [reportPostId, setReportPostId] = useState<number | null>(null);

  return (
    <div className="px-8 py-6">
      <Link to="/search" className="text-sm text-[#7a6f68] hover:text-[#5b63d3] transition-colors">← {t('nav.search')}</Link>
      <h2 className="font-serif text-2xl font-bold text-[#1c1714] mt-3 mb-6">#{tagName}</h2>

      {isLoading && <p className="text-[#7a6f68] text-sm text-center py-8">{t('common.loading')}</p>}
      {!isLoading && items.length === 0 && (
          <p className="text-[#7a6f68] text-sm text-center py-8">{t('tag.empty')}</p>
      )}

      <div className="space-y-4">
        {items.map((post) => (
          <PostCard key={post.postId} post={post} onReport={(id) => setReportPostId(id)} />
        ))}
      </div>

      {hasMore && (
        <button onClick={() => loadMore()} disabled={isFetching}
          className="mt-6 w-full py-2.5 rounded-xl border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] hover:border-[#5b63d3] hover:text-[#5b63d3] cursor-pointer transition disabled:opacity-50">
          {isFetching ? t('common.loading') : t('common.loadMore')}
        </button>
      )}

      {reportPostId !== null && <ReportModal targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />}
    </div>
  );
}
