import { useCursorPagination } from '../../../shared/hooks/useCursorPagination';
import type { Post } from '../../../shared/components/PostCard';

export function usePosts(userId: number | undefined) {
  return useCursorPagination<Post>(
    ['posts', userId],
    `/users/${userId}/posts`,
    'postId',
    20,
    {},
    !!userId,
  );
}
