import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../../shared/api/client';
import type { Post } from '../../../shared/components/PostCard';

interface PostFormData {
  title: string;
  author: string;
  description: string;
  tagNames?: string[];
  image?: File | null;
}

function buildFormData(data: PostFormData): FormData {
  const form = new FormData();
  const { image, ...rest } = data;
  form.append('data', new Blob([JSON.stringify(rest)], { type: 'application/json' }));
  if (image) form.append('image', image);
  return form;
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PostFormData) =>
      client.post<Post>('/posts', buildFormData(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePost(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PostFormData) =>
      client.patch<Post>(`/posts/${postId}`, buildFormData(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => client.delete(`/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
