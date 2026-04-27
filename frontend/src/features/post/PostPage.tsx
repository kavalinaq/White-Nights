import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePost } from './hooks/usePost';
import { useInteractions } from './hooks/useInteractions';
import { useComments } from './hooks/useComments';
import { useDeletePost } from './hooks/usePostMutations';
import { EditPostModal } from './EditPostModal';
import { useAuthStore } from '../../shared/store/useAuthStore';

export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const { data: post, isLoading } = usePost(postId);
  const { like, unlike, save, unsave, recordView } = useInteractions(postId);
  const { items: comments, hasMore, loadMore, isFetching: commentsFetching, addComment, deleteComment } = useComments(postId);
  const deletePost = useDeletePost();

  const [commentText, setCommentText] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (postId) recordView();
    // recordView is stable per postId — including it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  if (isLoading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>;
  if (!post) return <p style={{ textAlign: 'center', padding: '2rem' }}>Post not found.</p>;

  const isMine = user?.nickname === post.authorInfo.nickname;

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    await deletePost.mutateAsync(postId);
    navigate('/');
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment.mutateAsync(commentText.trim());
    setCommentText('');
  };

  return (
    <div className="post-page" style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <Link to="/" style={{ color: '#646cff', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to feed</Link>

      <div style={{ marginTop: '1rem' }}>
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', objectFit: 'cover', maxHeight: '360px' }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Link to={`/u/${post.authorInfo.nickname}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: 'inherit' }}>
            {post.authorInfo.avatarUrl
              ? <img src={post.authorInfo.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ccc' }} />}
            <span style={{ fontWeight: 600 }}>@{post.authorInfo.nickname}</span>
          </Link>
          <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: 'auto' }}>
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
          {isMine && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowEdit(true)} style={{ padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f5f5' }}>Edit</button>
              <button onClick={handleDelete} disabled={deletePost.isPending} style={{ padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px', border: 'none', background: '#e74c3c', color: '#fff' }}>Delete</button>
            </div>
          )}
        </div>

        <h1 style={{ margin: '0 0 0.25rem' }}>{post.title}</h1>
        <p style={{ color: '#555', marginTop: 0, marginBottom: '1rem' }}>{post.author}</p>
        <p style={{ lineHeight: 1.7, marginBottom: '1rem' }}>{post.description}</p>

        {post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
            {post.tags.map((tag) => (
              <Link key={tag.tagId} to={`/tags/${tag.name}`} style={{ fontSize: '0.8rem', background: '#eee', padding: '2px 8px', borderRadius: '12px', textDecoration: 'none', color: '#555' }}>
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {isAuthenticated && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={() => post.liked ? unlike.mutate() : like.mutate()}
              disabled={like.isPending || unlike.isPending}
              style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #ccc', cursor: 'pointer', background: post.liked ? '#e74c3c' : '#fff', color: post.liked ? '#fff' : '#333' }}
            >
              ♥ {post.likeCount}
            </button>
            <button
              onClick={() => post.saved ? unsave.mutate() : save.mutate()}
              disabled={save.isPending || unsave.isPending}
              style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #ccc', cursor: 'pointer', background: post.saved ? '#f39c12' : '#fff', color: post.saved ? '#fff' : '#333' }}
            >
              🔖 {post.saved ? 'Saved' : 'Save'}
            </button>
            <span style={{ color: '#888', alignSelf: 'center', fontSize: '0.875rem' }}>👁 {post.viewCount} views</span>
          </div>
        )}

        <h3 style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>Comments ({post.commentCount})</h3>

        {isAuthenticated && (
          <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              maxLength={2000}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <button type="submit" disabled={addComment.isPending || !commentText.trim()} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#646cff', color: '#fff', cursor: 'pointer' }}>
              Send
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {comments.map((c) => (
            <div key={c.commentId} style={{ background: '#f9f9f9', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Link to={`/u/${c.author.nickname}`} style={{ fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', color: '#333' }}>
                  @{c.author.nickname}
                </Link>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>{new Date(c.createdAt).toLocaleString()}</span>
                {(user?.nickname === c.author.nickname || user?.role === 'moderator' || user?.role === 'admin') && (
                  <button
                    onClick={() => deleteComment.mutate(c.commentId)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{c.text}</p>
            </div>
          ))}
        </div>

        {hasMore && (
          <button onClick={() => loadMore()} disabled={commentsFetching} style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', background: '#f5f5f5' }}>
            {commentsFetching ? 'Loading...' : 'Load more comments'}
          </button>
        )}
      </div>

      {showEdit && post && <EditPostModal post={post} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
