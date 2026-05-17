import {useCallback} from 'react';
import type {InfiniteData} from '@tanstack/react-query';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import client from '../../../shared/api/client';
import type {Post} from '../../../shared/components/PostCard';

type PatchFn = (p: Post) => Post;

export function useInteractions(postId: number) {
  const queryClient = useQueryClient();

  const patchEverywhere = (fn: PatchFn) => {
    queryClient.setQueryData<Post>(['post', postId], (old) => (old ? fn(old) : old));

    const patchPages = (old: InfiniteData<Post[]> | undefined) =>
      old
        ? { ...old, pages: old.pages.map((page) => page.map((p) => (p.postId === postId ? fn(p) : p))) }
        : old;

    queryClient.setQueryData<InfiniteData<Post[]>>(['feed'], patchPages);
    queryClient.setQueriesData<InfiniteData<Post[]>>({ queryKey: ['posts'] }, patchPages);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const like = useMutation({
    mutationFn: () => client.post(`/posts/${postId}/like`),
    onMutate: () => patchEverywhere((p) => ({ ...p, liked: true, likeCount: p.likeCount + 1 })),
    onError: invalidate,
    onSettled: invalidate,
  });

  const unlike = useMutation({
    mutationFn: () => client.delete(`/posts/${postId}/like`),
    onMutate: () => patchEverywhere((p) => ({ ...p, liked: false, likeCount: Math.max(0, p.likeCount - 1) })),
    onError: invalidate,
    onSettled: invalidate,
  });

  const save = useMutation({
    mutationFn: () => client.post(`/posts/${postId}/save`),
    onMutate: () => patchEverywhere((p) => ({ ...p, saved: true })),
    onError: invalidate,
    onSettled: invalidate,
  });

  const unsave = useMutation({
    mutationFn: () => client.delete(`/posts/${postId}/save`),
    onMutate: () => patchEverywhere((p) => ({ ...p, saved: false })),
    onError: invalidate,
    onSettled: invalidate,
  });

  const recordView = useCallback(
      () => client.post(`/posts/${postId}/view`).catch(() => {
      }),
      [postId]
  );

  return { like, unlike, save, unsave, recordView };
}
