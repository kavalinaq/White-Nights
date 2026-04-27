import { useCursorPagination } from '../../../shared/hooks/useCursorPagination';
import type { Post } from '../../../shared/components/PostCard';

export function useTagPosts(tagName: string) {
  return useCursorPagination<Post>(
    ['tag-posts', tagName],
    `/tags/${tagName}/posts`,
    'postId',
    20,
    {},
    !!tagName,
  );
}
