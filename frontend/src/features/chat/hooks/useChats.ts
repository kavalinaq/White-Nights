import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface ChatPreview {
  chatId: number;
  name: string;
  isGroup: boolean;
  memberCount: number;
  lastMessage: ChatMessage | null;
  avatarUrl: string | null;
  ownerId: number | null;
}

export interface ChatMember {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface ChatMessage {
  messageId: number;
  chatId: number;
  senderId: number;
  senderNickname: string;
  text: string | null;
  imageUrl: string | null;
  isDeleted: boolean;
  sentAt: string;
}

export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const res = await client.get<ChatPreview[]>('/chats');
      return res.data;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

interface CreateChatPayload {
  peerId?: number;
  name?: string;
  memberIds?: number[];
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChatPayload) =>
      client.post<ChatPreview>('/chats', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: number) => client.delete(`/chats/${chatId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function useDeleteMessage() {
  return useMutation({
    mutationFn: (messageId: number) => client.delete(`/messages/${messageId}`),
  });
}

export function useChatMembers(chatId: number | undefined) {
  return useQuery({
    queryKey: ['chat-members', chatId],
    queryFn: async () => {
      const res = await client.get<ChatMember[]>(`/chats/${chatId}/members`);
      return res.data;
    },
    enabled: !!chatId,
  });
}

export function useUpdateChatAvatar(chatId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return client.post<ChatPreview>(`/chats/${chatId}/avatar`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['chats']});
    },
  });
}
