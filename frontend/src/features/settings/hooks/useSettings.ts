import { useMutation } from '@tanstack/react-query';
import client from '../../../shared/api/client';
import { useCursorPagination } from '../../../shared/hooks/useCursorPagination';
import type { Post } from '../../../shared/components/PostCard';

export function useSavedPosts() {
  return useCursorPagination<Post>(['saved-posts'], '/users/me/saved', 'postId', 20);
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      client.post('/users/me/password', { currentPassword, newPassword }),
  });
}

export function useSendSupport() {
  return useMutation({
    mutationFn: ({ subject, message }: { subject: string; message: string }) =>
      client.post('/support', { subject, message }),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => client.delete('/users/me'),
  });
}
