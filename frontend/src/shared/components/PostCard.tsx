import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useInteractions } from '../../features/post/hooks/useInteractions';

export interface Tag {
  tagId: number;
  name: string;
}

export interface AuthorInfo {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
}

export interface Post {
  postId: number;
  imageUrl: string | null;
  title: string;
  author: string;
  description: string;
  createdAt: string;
  authorInfo: AuthorInfo;
  tags: Tag[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  liked: boolean;
  saved: boolean;
}

interface Props {
  post: Post;
  onReport?: (postId: number) => void;
}

export function PostCard({ post, onReport }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { like, unlike, save, unsave } = useInteractions(post.postId);

  const toggleLike = () => (post.liked ? unlike.mutate() : like.mutate());
  const toggleSave = () => (post.saved ? unsave.mutate() : save.mutate());

  return (
    <div className="post-card">
      {post.imageUrl && (
        <Link to={`/posts/${post.postId}`}>
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '8px' }}
          />
        </Link>
      )}

      <div className="post-card-body" style={{ padding: '0.75rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Link to={`/u/${post.authorInfo.nickname}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: 'inherit' }}>
            {post.authorInfo.avatarUrl ? (
              <img src={post.authorInfo.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ccc' }} />
            )}
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>@{post.authorInfo.nickname}</span>
          </Link>
          <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: 'auto' }}>
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>

        <Link to={`/posts/${post.postId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{post.title}</h3>
          <p style={{ margin: '0 0 0.5rem', color: '#555', fontSize: '0.875rem' }}>
            {post.author}
          </p>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#333', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.description}
          </p>
        </Link>

        {post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {post.tags.map((tag) => (
              <Link key={tag.tagId} to={`/tags/${tag.name}`} style={{ fontSize: '0.75rem', background: '#eee', padding: '2px 8px', borderRadius: '12px', textDecoration: 'none', color: '#555' }}>
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem', color: '#666' }}>
          {isAuthenticated && (
            <>
              <button
                onClick={toggleLike}
                disabled={like.isPending || unlike.isPending}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: post.liked ? '#e74c3c' : '#666', padding: 0 }}
              >
                ♥ {post.likeCount}
              </button>
              <button
                onClick={toggleSave}
                disabled={save.isPending || unsave.isPending}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: post.saved ? '#f39c12' : '#666', padding: 0 }}
              >
                🔖 {post.saved ? 'Saved' : 'Save'}
              </button>
            </>
          )}
          {!isAuthenticated && <span>♥ {post.likeCount}</span>}
          <Link to={`/posts/${post.postId}`} style={{ color: '#666', textDecoration: 'none' }}>
            💬 {post.commentCount}
          </Link>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>👁 {post.viewCount}</span>
          {isAuthenticated && onReport && (
            <button
              onClick={() => onReport(post.postId)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.75rem', padding: 0 }}
            >
              ⚑ Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
