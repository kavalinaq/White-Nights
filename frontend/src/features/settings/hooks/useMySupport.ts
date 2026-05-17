import {useQuery} from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface MySupportMessage {
  supportMessageId: number;
  subject: string;
  message: string;
  response: string | null;
  respondedAt: string | null;
  respondedByNickname: string | null;
  status: 'open' | 'resolved';
  createdAt: string;
}

export function useMySupport() {
  return useQuery<MySupportMessage[]>({
    queryKey: ['support', 'me'],
    queryFn: async () => {
      const res = await client.get('/support/messages/me');
      return res.data;
    },
  });
}
