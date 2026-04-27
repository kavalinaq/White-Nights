import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface TrackerEntry {
  date: string;
  pagesRead: number | null;
}

export function useTrackerMonth(month: string) {
  return useQuery({
    queryKey: ['tracker', month],
    queryFn: async () => {
      const res = await client.get<TrackerEntry[]>('/tracker', { params: { month } });
      return res.data;
    },
    enabled: !!month,
  });
}

export function useUpsertTrackerEntry(month: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, pagesRead }: { date: string; pagesRead: number | null }) =>
      client.put<TrackerEntry>(`/tracker/${date}`, { pagesRead }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker', month] });
    },
  });
}

export function useDeleteTrackerEntry(month: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => client.delete(`/tracker/${date}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker', month] });
    },
  });
}
