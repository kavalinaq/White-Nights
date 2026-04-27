import { useMutation } from '@tanstack/react-query';
import client from '../../../shared/api/client';

interface CreateReportPayload {
  targetType: 'post' | 'comment' | 'user';
  targetId: number;
  reason: string;
}

export function useReport() {
  return useMutation({
    mutationFn: (payload: CreateReportPayload) =>
      client.post('/reports', payload),
  });
}
