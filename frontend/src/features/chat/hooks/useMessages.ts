import { useCursorPagination } from '../../../shared/hooks/useCursorPagination';
import type { ChatMessage } from './useChats';

export function useMessages(chatId: number | undefined) {
  return useCursorPagination<ChatMessage>(
    ['messages', chatId],
    `/chats/${chatId}/messages`,
    'messageId',
    50,
    {},
    !!chatId,
  );
}
