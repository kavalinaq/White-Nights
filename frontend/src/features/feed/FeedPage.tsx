import { useState } from 'react';
import { useFeed } from './hooks/useFeed';
import { PostCard } from '../../shared/components/PostCard';
import { CreatePostModal } from '../post/CreatePostModal';
import { ReportModal } from '../moderation/ReportModal';

export function FeedPage() {
  const { items, hasMore, loadMore, isLoading, isFetching } = useFeed();
  const [showCreate, setShowCreate] = useState(false);
  const [reportPostId, setReportPostId] = useState<number | null>(null);

  return (
    <div className="feed-page" style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Feed</h2>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: '#646cff', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
        >
          + New post
        </button>
      </div>

      {isLoading && <p style={{ textAlign: 'center', color: '#888' }}>Loading feed...</p>}

      {!isLoading && items.length === 0 && (
        <div style={{ textAlign: 'center', color: '#888', marginTop: '3rem' }}>
          <p>Your feed is empty.</p>
          <p style={{ fontSize: '0.875rem' }}>Follow some users to see their posts here.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {items.map((post) => (
          <PostCard key={post.postId} post={post} onReport={(id) => setReportPostId(id)} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => loadMore()}
          disabled={isFetching}
          style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', background: '#f5f5f5' }}
        >
          {isFetching ? 'Loading...' : 'Load more'}
        </button>
      )}

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
      {reportPostId !== null && (
        <ReportModal targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />
      )}
    </div>
  );
}
