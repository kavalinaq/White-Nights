import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface FollowUser {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
}

interface Profile {
  followerCount: number;
  followingCount: number;
  followStatus: string | null;
  [key: string]: unknown;
}

export const useFollowers = (userId: number | undefined) => {
  return useQuery<FollowUser[]>({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const res = await client.get(`/users/${userId}/followers`);
      return res.data;
    },
    enabled: !!userId,
  });
};

export const useFollowing = (userId: number | undefined) => {
  return useQuery<FollowUser[]>({
    queryKey: ['following', userId],
    queryFn: async () => {
      const res = await client.get(`/users/${userId}/following`);
      return res.data;
    },
    enabled: !!userId,
  });
};

export const useFollow = (targetUserId: number | undefined, targetNickname: string | undefined) => {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['profile', targetNickname] });

  const follow = useMutation({
    mutationFn: () => client.post(`/users/${targetUserId}/follow`),
    onMutate: () => {
      queryClient.setQueryData<Profile>(['profile', targetNickname], (old) =>
        old ? { ...old, followStatus: 'pending', followerCount: old.followerCount + 1 } : old
      );
    },
    onError: invalidate,
    onSettled: invalidate,
  });

  const unfollow = useMutation({
    mutationFn: () => client.delete(`/users/${targetUserId}/follow`),
    onMutate: () => {
      queryClient.setQueryData<Profile>(['profile', targetNickname], (old) =>
        old ? { ...old, followStatus: null, followerCount: Math.max(0, old.followerCount - 1) } : old
      );
    },
    onError: invalidate,
    onSettled: invalidate,
  });

  return { follow, unfollow };
};

export const useFollowRequests = () => {
  return useQuery({
    queryKey: ['follow-requests'],
    queryFn: async () => {
      const response = await client.get('/users/me/follow-requests');
      return response.data;
    },
  });
};

export const useHandleFollowRequest = () => {
  const queryClient = useQueryClient();

  const accept = useMutation({
    mutationFn: (followerId: number) => client.post(`/users/me/follow-requests/${followerId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const reject = useMutation({
    mutationFn: (followerId: number) => client.post(`/users/me/follow-requests/${followerId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return { accept, reject };
};
