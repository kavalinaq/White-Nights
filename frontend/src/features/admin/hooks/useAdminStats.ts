import {useQuery} from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface AdminStats {
  users: number;
  posts: number;
  pendingReports: number;
  chats: number;
  moderators: number;
  onlineUsers: number;
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await client.get('/admin/stats');
      return res.data;
    },
    refetchInterval: 15000,
  });
}
