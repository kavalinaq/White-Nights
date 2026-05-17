import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {usePost} from './hooks/usePost';
import {useInteractions} from './hooks/useInteractions';
import {type Comment, useComments, useReplies} from './hooks/useComments';
import {useDeletePost} from './hooks/usePostMutations';
import {EditPostModal} from './EditPostModal';
import {useAuthStore} from '../../shared/store/useAuthStore';
import {Avatar} from '../../shared/components/Avatar';
import {ReportModal} from '../moderation/ReportModal';

interface CommentItemProps {
  comment: Comment;
  postAuthorNickname: string;
  currentUser: { nickname: string; role?: string } | null;
  isAuthenticated: boolean;
  addComment: { mutateAsync: (p: { text: string; parentCommentId?: number }) => Promise<unknown>; isPending: boolean };
  deleteComment: { mutate: (p: { commentId: number; parentCommentId?: number | null }) => void };
}

function CommentItem({ comment, postAuthorNickname, currentUser, isAuthenticated, addComment, deleteComment }: CommentItemProps) {
  const {t} = useTranslation();
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [reportingId, setReportingId] = useState<number | null>(null);

  const { data: replies = [], isLoading: repliesLoading } = useReplies(comment.commentId, showReplies);

  const canDelete = currentUser?.nickname === comment.author.nickname
    || currentUser?.nickname === postAuthorNickname
    || currentUser?.role === 'moderator'
    || currentUser?.role === 'admin';

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await addComment.mutateAsync({ text: replyText.trim(), parentCommentId: comment.commentId });
    setReplyText('');
    setIsReplying(false);
    setShowReplies(true);
  };

  return (
    <div className="bg-[#faf7f2] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Avatar src={comment.author.avatarUrl} name={comment.author.nickname} size="sm" />
        <Link to={`/u/${comment.author.nickname}`} className="font-semibold text-sm no-underline text-[#2d2926] hover:text-[#5b63d3] transition-colors">
          @{comment.author.nickname}
        </Link>
        <span className="text-xs text-[#7a6f68]">{new Date(comment.createdAt).toLocaleString()}</span>
        {canDelete && (
          <button
            onClick={() => deleteComment.mutate({ commentId: comment.commentId })}
            className="ml-auto text-xs text-[#b0a9a1] hover:text-red-400 bg-transparent border-none cursor-pointer transition"
          >✕</button>
        )}
      </div>
      <p className="text-sm text-[#2d2926] m-0">{comment.text}</p>

      <div className="flex gap-3 mt-2">
        {isAuthenticated && (
          <button
            onClick={() => setIsReplying(v => !v)}
            className="text-xs text-[#7a6f68] hover:text-[#5b63d3] bg-transparent border-none cursor-pointer transition"
          >
            {isReplying ? t('common.cancel') : t('common.reply')}
          </button>
        )}
        <button
          onClick={() => setShowReplies(v => !v)}
          className="text-xs text-[#7a6f68] hover:text-[#5b63d3] bg-transparent border-none cursor-pointer transition"
        >
          {showReplies ? t('post.hideReplies') : t('post.showReplies')}
        </button>
        {isAuthenticated && currentUser?.nickname !== comment.author.nickname && (
            <button
                onClick={() => setReportingId(comment.commentId)}
                className="text-xs text-[#b0a9a1] hover:text-red-500 bg-transparent border-none cursor-pointer transition ml-auto"
            >
              ⚑ {t('common.report')}
            </button>
        )}
      </div>

      {isReplying && (
        <form onSubmit={handleReply} className="flex gap-2 mt-2 ml-6">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={`${t('common.reply')} @${comment.author.nickname}…`}
            maxLength={2000}
            autoFocus
            className="flex-1 px-3 py-1.5 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition"
          />
          <button
            type="submit"
            disabled={addComment.isPending || !replyText.trim()}
            className="px-3 py-1.5 rounded-lg bg-[#5b63d3] hover:bg-[#4951c4] text-white text-xs font-medium border-none cursor-pointer transition disabled:opacity-50"
          >
            {t('common.reply')}
          </button>
        </form>
      )}

      {reportingId !== null && (
          <ReportModal targetType="comment" targetId={reportingId} onClose={() => setReportingId(null)}/>
      )}

      {showReplies && (
        <div className="mt-3 ml-6 space-y-2">
          {repliesLoading ? (
              <p className="text-xs text-[#7a6f68]">{t('common.loading')}</p>
          ) : replies.length === 0 ? (
              <p className="text-xs text-[#7a6f68] italic">{t('post.noReplies')}</p>
          ) : (
            replies.map(reply => {
              const canDeleteReply = currentUser?.nickname === reply.author.nickname
                || currentUser?.nickname === postAuthorNickname
                || currentUser?.role === 'moderator'
                || currentUser?.role === 'admin';
              return (
                <div key={reply.commentId} className="bg-white rounded-xl p-3 border border-[#f3ede4]">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={reply.author.avatarUrl} name={reply.author.nickname} size="sm" />
                    <Link to={`/u/${reply.author.nickname}`} className="font-semibold text-sm no-underline text-[#2d2926] hover:text-[#5b63d3] transition-colors">
                      @{reply.author.nickname}
                    </Link>
                    <span className="text-xs text-[#7a6f68]">{new Date(reply.createdAt).toLocaleString()}</span>
                    {canDeleteReply && (
                      <button
                        onClick={() => deleteComment.mutate({ commentId: reply.commentId, parentCommentId: comment.commentId })}
                        className="ml-auto text-xs text-[#b0a9a1] hover:text-red-400 bg-transparent border-none cursor-pointer transition"
                      >✕</button>
                    )}
                    {isAuthenticated && currentUser?.nickname !== reply.author.nickname && (
                        <button
                            onClick={() => setReportingId(reply.commentId)}
                            className={`text-xs text-[#b0a9a1] hover:text-red-500 bg-transparent border-none cursor-pointer transition ${canDeleteReply ? '' : 'ml-auto'}`}
                            title={t('common.report')}
                        >⚑</button>
                    )}
                  </div>
                  <p className="text-sm text-[#2d2926] m-0">{reply.text}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function PostPage() {
  const {t} = useTranslation();
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
  }, [postId, recordView]);

  if (isLoading) return <div className="px-8 py-8 text-center text-[#7a6f68]">{t('common.loading')}</div>;
  if (!post) return <div className="px-8 py-8 text-center text-[#7a6f68]">{t('post.notFound')}</div>;

  const isMine = user?.nickname === post.authorInfo.nickname;

  const handleDelete = async () => {
    if (!confirm(t('post.deleteConfirm'))) return;
    await deletePost.mutateAsync(postId);
    navigate('/');
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment.mutateAsync({ text: commentText.trim() });
    setCommentText('');
  };

  return (
    <div className="px-8 py-6">
      <Link to="/" className="text-sm text-[#7a6f68] hover:text-[#5b63d3] transition-colors">← {t('post.backToFeed')}</Link>

      <article className="mt-4 bg-white rounded-2xl border border-[#e8e2d9] shadow-sm overflow-hidden">
        {post.imageUrl && (
            <img
                src={post.imageUrl}
                alt={post.title}
                className="block mx-auto max-w-150 h-auto rounded-t-2xl"
            />
        )}

        <div className="p-6">
          {/* Author + actions */}
          <div className="flex items-center gap-3 mb-5">
            <Link to={`/u/${post.authorInfo.nickname}`} className="flex items-center gap-2 no-underline">
              <Avatar src={post.authorInfo.avatarUrl} name={post.authorInfo.nickname} size="md" />
              <span className="font-semibold text-sm text-[#2d2926] hover:text-[#5b63d3] transition-colors">@{post.authorInfo.nickname}</span>
            </Link>
            <span className="text-xs text-[#7a6f68] ml-auto">{new Date(post.createdAt).toLocaleDateString()}</span>
            {isMine && (
              <div className="flex gap-2">
                <button onClick={() => setShowEdit(true)}
                        className="px-3 py-1 text-xs rounded-lg border border-[#e8e2d9] bg-white text-[#7a6f68] cursor-pointer hover:border-[#5b63d3] transition">{t('common.edit')}</button>
                <button onClick={handleDelete} disabled={deletePost.isPending}
                        className="px-3 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white border-none cursor-pointer transition disabled:opacity-50">{t('common.delete')}</button>
              </div>
            )}
          </div>

          <h1 className="font-serif text-2xl font-bold text-[#1c1714] mb-1">{post.title}</h1>
          <p className="text-sm text-[#7a6f68] italic mb-4">{post.author}</p>
          <p className="text-sm leading-relaxed text-[#2d2926] mb-5">{post.description}</p>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.map((tag) => (
                <Link key={tag.tagId} to={`/tags/${tag.name}`}
                  className="text-xs bg-[#eef0ff] text-[#5b63d3] px-2.5 py-0.5 rounded-full no-underline hover:bg-[#5b63d3] hover:text-white transition font-medium">
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {isAuthenticated && (
            <div className="flex gap-3 pb-5 border-b border-[#f3ede4]">
              <button
                onClick={() => post.liked ? unlike.mutate() : like.mutate()}
                disabled={like.isPending || unlike.isPending}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border cursor-pointer transition disabled:opacity-50 ${post.liked ? 'bg-red-50 border-red-200 text-red-500 font-semibold' : 'bg-white border-[#e8e2d9] text-[#7a6f68] hover:border-red-200 hover:text-red-400'}`}
              >
                {post.liked ? '♥' : '♡'} {post.likeCount}
              </button>
              <button
                onClick={() => post.saved ? unsave.mutate() : save.mutate()}
                disabled={save.isPending || unsave.isPending}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border cursor-pointer transition disabled:opacity-50 ${post.saved ? 'bg-amber-50 border-amber-200 text-amber-500 font-semibold' : 'bg-white border-[#e8e2d9] text-[#7a6f68] hover:border-amber-200 hover:text-amber-400'}`}
              >
                {post.saved ? `🔖 ${t('post.saved')}` : `🏷️ ${t('post.savedAction')}`}
              </button>
              <span className="ml-auto text-xs text-[#7a6f68] self-center">👁 {t('post.views', {count: post.viewCount})}</span>
            </div>
          )}

          {/* Comments */}
          <div className="mt-5">
            <h3 className="font-serif font-bold text-[#1c1714] mb-4">{t('post.commentsCount', {count: post.commentCount})}</h3>

            {isAuthenticated && (
              <form onSubmit={handleComment} className="flex gap-2 mb-5">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                       placeholder={t('post.addComment')} maxLength={2000}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition" />
                <button type="submit" disabled={addComment.isPending || !commentText.trim()}
                  className="px-4 py-2 rounded-lg bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-medium border-none cursor-pointer transition disabled:opacity-50">
                  {t('post.post')}
                </button>
              </form>
            )}

            <div className="space-y-3">
              {comments.map((c) => (
                <CommentItem
                  key={c.commentId}
                  comment={c}
                  postAuthorNickname={post.authorInfo.nickname}
                  currentUser={user}
                  isAuthenticated={isAuthenticated}
                  addComment={addComment}
                  deleteComment={deleteComment}
                />
              ))}
            </div>

            {hasMore && (
              <button onClick={() => loadMore()} disabled={commentsFetching}
                className="mt-4 w-full py-2 rounded-xl border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] hover:border-[#5b63d3] cursor-pointer transition disabled:opacity-50">
                {commentsFetching ? t('common.loading') : t('post.loadMoreComments')}
              </button>
            )}
          </div>
        </div>
      </article>

      {showEdit && post && <EditPostModal post={post} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
