import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSearch } from './hooks/useSearch';
import { PostCard } from '../../shared/components/PostCard';
import { ReportModal } from '../moderation/ReportModal';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [input, setInput] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [reportPostId, setReportPostId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(input);
      if (input.trim()) {
        setSearchParams({ q: input.trim() }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, setSearchParams]);

  const { data, isLoading } = useSearch(debouncedQ);

  const hasResults = data && (data.users.length > 0 || data.posts.length > 0 || data.tags.length > 0);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2 style={{ margin: '0 0 1rem' }}>Search</h2>

      <input
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search users, posts, tags..."
        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }}
      />

      {isLoading && debouncedQ && (
        <p style={{ color: '#888', marginTop: '1rem' }}>Searching...</p>
      )}

      {debouncedQ && !isLoading && !hasResults && (
        <p style={{ color: '#888', marginTop: '1.5rem', textAlign: 'center' }}>No results for "{debouncedQ}"</p>
      )}

      {data && (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {data.users.length > 0 && (
            <section>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Users</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.users.map((u) => (
                  <Link
                    key={u.userId}
                    to={`/u/${u.nickname}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '8px', textDecoration: 'none', color: 'inherit', background: '#f9f9f9' }}
                  >
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ddd', flexShrink: 0 }} />
                    }
                    <div>
                      <div style={{ fontWeight: 600 }}>@{u.nickname}</div>
                      {u.isPrivate && <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Private</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.tags.length > 0 && (
            <section>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {data.tags.map((tag) => (
                  <Link
                    key={tag.tagId}
                    to={`/tags/${tag.name}`}
                    style={{ padding: '4px 12px', borderRadius: '16px', background: '#eee', textDecoration: 'none', color: '#555', fontSize: '0.875rem' }}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.posts.length > 0 && (
            <section>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {data.posts.map((post) => (
                  <PostCard key={post.postId} post={post} onReport={(id) => setReportPostId(id)} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}

      {reportPostId !== null && (
        <ReportModal targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />
      )}
    </div>
  );
}
