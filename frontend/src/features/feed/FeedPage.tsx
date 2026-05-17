import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useFeed} from './hooks/useFeed';
import {PostCard} from '../../shared/components/PostCard';
import {CreatePostModal} from '../post/CreatePostModal';
import {ReportModal} from '../moderation/ReportModal';

export function FeedPage() {
  const {t} = useTranslation();
  const { items, hasMore, loadMore, isLoading, isFetching } = useFeed();
  const [showCreate, setShowCreate] = useState(false);
  const [reportPostId, setReportPostId] = useState<number | null>(null);

  return (
    <div className="px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-2xl font-bold text-[#1c1714]">{t('feed.title')}</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#5b63d3] hover:bg-[#4951c4] text-white rounded-full text-sm font-semibold border-none cursor-pointer transition-colors"
        >
          + {t('feed.newPost')}
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-white rounded-xl border border-[#e8e2d9] animate-pulse" />)}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-16 text-[#7a6f68]">
          <div className="text-5xl mb-4">📚</div>
          <p className="font-serif text-lg text-[#2d2926] mb-1">{t('feed.empty')}</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((post) => (
          <PostCard key={post.postId} post={post} onReport={(id) => setReportPostId(id)} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => loadMore()} disabled={isFetching}
          className="mt-6 w-full py-2.5 rounded-xl border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] hover:border-[#5b63d3] hover:text-[#5b63d3] cursor-pointer transition disabled:opacity-50"
        >
          {isFetching ? t('common.loading') : t('common.loadMore')}
        </button>
      )}

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
      {reportPostId !== null && <ReportModal targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />}
    </div>
  );
}
