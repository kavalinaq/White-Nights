import { useEffect, useRef, useState } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { ChatMessage } from './useChats';

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'http://localhost:8080/ws';

export function useChatSocket(chatId: number | undefined, onMessage: (msg: ChatMessage) => void) {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!chatId) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const stomp = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        stomp.subscribe(`/topic/chat/${chatId}`, (frame: IMessage) => {
          try {
            const msg = JSON.parse(frame.body) as ChatMessage;
            onMessageRef.current(msg);
          } catch {
            // ignore malformed frames
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    clientRef.current = stomp;
    stomp.activate();

    return () => {
      stomp.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [chatId]);

  const sendMessage = (text: string) => {
    if (!clientRef.current || !chatId) return;
    clientRef.current.publish({
      destination: `/app/chat/${chatId}`,
      body: text,
    });
  };

  return { connected, sendMessage };
}
