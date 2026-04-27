import { useQuery } from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface Book {
  bookId: number;
  title: string;
  author: string;
}

export interface Shelf {
  shelfId: number;
  name: string;
  position: number;
  books: Book[];
}

export function useShelves(userId: number | undefined) {
  return useQuery({
    queryKey: ['shelves', userId],
    queryFn: async () => {
      const res = await client.get<Shelf[]>(`/users/${userId}/shelves`);
      return res.data;
    },
    enabled: !!userId,
  });
}
