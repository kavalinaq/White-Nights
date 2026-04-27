import { useQuery } from '@tanstack/react-query';
import client from '../../../shared/api/client';
import type { Post } from '../../../shared/components/PostCard';

export function usePost(postId: number) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await client.get<Post>(`/posts/${postId}`);
      return res.data;
    },
    enabled: !!postId,
  });
}
