import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTagPosts } from './hooks/useTagPosts';
import { PostCard } from '../../shared/components/PostCard';
import { ReportModal } from '../moderation/ReportModal';

export function TagPage() {
  const { name } = useParams<{ name: string }>();
  const tagName = name ?? '';
  const { items, hasMore, loadMore, isLoading, isFetching } = useTagPosts(tagName);
  const [reportPostId, setReportPostId] = useState<number | null>(null);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <Link to="/search" style={{ color: '#646cff', textDecoration: 'none', fontSize: '0.875rem' }}>← Search</Link>

      <h2 style={{ margin: '0.75rem 0 1.5rem' }}>#{tagName}</h2>

      {isLoading && <p style={{ color: '#888', textAlign: 'center' }}>Loading...</p>}

      {!isLoading && items.length === 0 && (
        <p style={{ color: '#888', textAlign: 'center' }}>No posts with this tag yet.</p>
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

      {reportPostId !== null && (
        <ReportModal targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />
      )}
    </div>
  );
}
