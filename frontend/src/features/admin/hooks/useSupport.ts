import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface SupportMessage {
  supportMessageId: number;
  userId: number;
  userNickname: string;
  subject: string;
  message: string;
  response: string | null;
  respondedAt: string | null;
  respondedByNickname: string | null;
  status: 'open' | 'resolved';
  createdAt: string;
}

export function useSupportQueue() {
  return useQuery<SupportMessage[]>({
    queryKey: ['admin', 'support'],
    queryFn: async () => {
      const res = await client.get('/admin/support/messages', {params: {limit: 100}});
      return res.data;
    },
  });
}

export function useReplySupport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, response}: { id: number; response: string }) =>
        client.post(`/admin/support/messages/${id}/reply`, {response}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['admin', 'support']}),
  });
}
