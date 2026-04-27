import { useQuery } from '@tanstack/react-query';
import client from '../../../shared/api/client';
import type { Post, Tag } from '../../../shared/components/PostCard';

interface UserSearchResult {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  isPrivate: boolean;
}

export interface SearchResponse {
  users: UserSearchResult[];
  posts: Post[];
  tags: Tag[];
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      const res = await client.get<SearchResponse>('/search', { params: { q } });
      return res.data;
    },
    enabled: q.trim().length > 0,
  });
}
