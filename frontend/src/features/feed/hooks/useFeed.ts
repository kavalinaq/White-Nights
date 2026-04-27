import { useCursorPagination } from '../../../shared/hooks/useCursorPagination';
import type { Post } from '../../../shared/components/PostCard';

export function useFeed() {
  return useCursorPagination<Post>(['feed'], '/feed', 'postId', 20);
}
