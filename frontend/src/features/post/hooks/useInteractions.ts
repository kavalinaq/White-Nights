import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../../shared/api/client';

export function useInteractions(postId: number) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const like = useMutation({
    mutationFn: () => client.post(`/posts/${postId}/like`),
    onSuccess: invalidate,
  });

  const unlike = useMutation({
    mutationFn: () => client.delete(`/posts/${postId}/like`),
    onSuccess: invalidate,
  });

  const save = useMutation({
    mutationFn: () => client.post(`/posts/${postId}/save`),
    onSuccess: invalidate,
  });

  const unsave = useMutation({
    mutationFn: () => client.delete(`/posts/${postId}/save`),
    onSuccess: invalidate,
  });

  const recordView = () =>
    client.post(`/posts/${postId}/view`).catch(() => {});

  return { like, unlike, save, unsave, recordView };
}
