import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../../shared/api/client';

export const useProfile = (nickname: string) => {
  return useQuery({
    queryKey: ['profile', nickname],
    queryFn: async () => {
      const response = await client.get(`/users/${nickname}`);
      return response.data;
    },
    enabled: !!nickname,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: any) => {
      const response = await client.patch('/users/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', data.nickname] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await client.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
