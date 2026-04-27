import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../../shared/api/client';
import type { Book } from './useShelves';

interface AddBookPayload {
  shelfId: number;
  title: string;
  author: string;
}

interface MoveBookPayload {
  bookId: number;
  toShelfId: number;
  position?: number;
}

export function useAddBook(userId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shelfId, title, author }: AddBookPayload) =>
      client.post<Book>(`/shelves/${shelfId}/books`, { title, author }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves', userId] });
    },
  });
}

export function useDeleteBook(userId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookId: number) => client.delete(`/books/${bookId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves', userId] });
    },
  });
}

export function useMoveBook(userId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, toShelfId, position }: MoveBookPayload) =>
      client.post(`/books/${bookId}/move`, { toShelfId, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves', userId] });
    },
  });
}
