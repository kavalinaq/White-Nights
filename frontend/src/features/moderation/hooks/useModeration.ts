import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import client from '../../../shared/api/client';

export type ReportStatus = 'pending' | 'in_review' | 'resolved';
export type ReportTargetType = 'post' | 'comment' | 'user';
export type ModerationActionType = 'block_post' | 'warn_user' | 'ban_user' | 'reject';

export interface Report {
  reportId: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reporterUserId?: number | null;
  reporterNickname?: string | null;
  targetUserNickname?: string | null;
  targetPostTitle?: string | null;
  targetCommentPostId?: number | null;
  targetCommentText?: string | null;
}

export function useReportQueue(status?: string) {
  return useQuery<Report[]>({
    queryKey: ['moderation', 'queue', status],
    queryFn: async () => {
      const res = await client.get('/moderation/reports', { params: { status, limit: 50 } });
      return res.data;
    },
  });
}

export function useClaimReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: number) => client.post(`/moderation/reports/${reportId}/claim`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation'] }),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, action, comment }: { reportId: number; action: ModerationActionType; comment?: string }) =>
      client.post(`/moderation/reports/${reportId}/resolve`, { action, comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation'] }),
  });
}
