import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../../shared/api/client';
import { useCursorPagination } from '../../../shared/hooks/useCursorPagination';

export interface Comment {
  commentId: number;
  text: string;
  createdAt: string;
  author: {
    userId: number;
    nickname: string;
    avatarUrl: string | null;
  };
}

export function useComments(postId: number) {
  const queryClient = useQueryClient();

  const pagination = useCursorPagination<Comment>(
    ['comments', postId],
    `/posts/${postId}/comments`,
    'commentId',
    20,
  );

  const addComment = useMutation({
    mutationFn: (text: string) =>
      client.post<Comment>(`/posts/${postId}/comments`, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: number) => client.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  return { ...pagination, addComment, deleteComment };
}
