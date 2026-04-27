import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface ChatPreview {
  chatId: number;
  name: string;
  isGroup: boolean;
  memberCount: number;
  lastMessage: ChatMessage | null;
}

export interface ChatMessage {
  messageId: number;
  chatId: number;
  senderId: number;
  senderNickname: string;
  text: string;
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
