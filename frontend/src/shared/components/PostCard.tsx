import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '../store/useAuthStore';
import {useInteractions} from '../../features/post/hooks/useInteractions';
import {Avatar} from './Avatar';

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
  const {t} = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { like, unlike, save, unsave } = useInteractions(post.postId);

  return (
    <article className="bg-white rounded-xl border border-[#e8e2d9] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={post.imageUrl ? 'flex' : undefined}>
        {post.imageUrl && (
          <Link to={`/posts/${post.postId}`} className="flex-shrink-0 w-1/4">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover aspect-square"
            />
          </Link>
        )}

        <div className="p-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Link to={`/u/${post.authorInfo.nickname}`} className="flex items-center gap-2 no-underline">
              <Avatar src={post.authorInfo.avatarUrl} name={post.authorInfo.nickname} size="sm" />
              <span className="text-sm font-semibold text-[#2d2926] hover:text-[#5b63d3] transition-colors">
                @{post.authorInfo.nickname}
              </span>
            </Link>
            <span className="text-xs text-[#7a6f68] ml-auto">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>

          <Link to={`/posts/${post.postId}`} className="no-underline group block mb-3">
            <h3 className="font-serif text-base font-bold text-[#1c1714] group-hover:text-[#5b63d3] transition-colors mb-0.5">
              {post.title}
            </h3>
            <p className="text-xs text-[#7a6f68] italic mb-2">{post.author}</p>
            <p className="text-sm text-[#2d2926] line-clamp-3 leading-relaxed">{post.description}</p>
          </Link>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map((tag) => (
                <Link key={tag.tagId} to={`/tags/${tag.name}`}
                  className="text-xs bg-[#eef0ff] text-[#5b63d3] px-2 py-0.5 rounded-full no-underline hover:bg-[#5b63d3] hover:text-white transition-colors font-medium">
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-[#f3ede4] text-sm text-[#7a6f68]">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => post.liked ? unlike.mutate() : like.mutate()}
                  disabled={like.isPending || unlike.isPending}
                  className={`flex items-center gap-1 cursor-pointer border-none bg-transparent p-0 text-sm transition-colors disabled:opacity-50
                    ${post.liked ? 'text-red-500 font-semibold' : 'hover:text-red-400'}`}
                >
                  {post.liked ? '♥' : '♡'} {post.likeCount}
                </button>
                <button
                  onClick={() => post.saved ? unsave.mutate() : save.mutate()}
                  disabled={save.isPending || unsave.isPending}
                  className={`flex items-center gap-1 cursor-pointer border-none bg-transparent p-0 text-sm transition-colors disabled:opacity-50
                    ${post.saved ? 'text-amber-500 font-semibold' : 'hover:text-amber-400'}`}
                >
                  🔖 {post.saved ? t('post.saved') : t('post.savedAction')}
                </button>
              </>
            ) : (
              <span>♡ {post.likeCount}</span>
            )}
            <Link to={`/posts/${post.postId}`}
              className="flex items-center gap-1 no-underline text-[#7a6f68] hover:text-[#5b63d3] transition-colors">
              💬 {post.commentCount}
            </Link>
            <span className="ml-auto text-xs">👁 {post.viewCount}</span>
            {isAuthenticated && onReport && (
              <button onClick={() => onReport(post.postId)}
                className="cursor-pointer border-none bg-transparent p-0 text-xs text-[#b0a9a1] hover:text-red-400 transition-colors">
                ⚑ {t('common.report')}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
