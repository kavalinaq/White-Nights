import { useInfiniteQuery } from '@tanstack/react-query';
import client from '../api/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCursorPagination<T extends Record<string, any>>(
  queryKey: unknown[],
  url: string,
  idField: keyof T,
  limit = 20,
  params: Record<string, string | number | undefined> = {},
  enabled = true,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const response = await client.get<T[]>(url, {
        params: { ...params, cursor: pageParam, limit },
      });
      return response.data;
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < limit) return undefined;
      return lastPage[lastPage.length - 1][idField] as number;
    },
    enabled,
  });

  return {
    items: query.data?.pages.flat() ?? [],
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}
