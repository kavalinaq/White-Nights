import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useChats, type ChatMessage } from './hooks/useChats';
import { useMessages } from './hooks/useMessages';
import { useChatSocket } from './hooks/useChatSocket';

export function ChatsPage() {
  const { id } = useParams<{ id: string }>();
  const activeId = id ? Number(id) : undefined;
  const { data: chats, isLoading } = useChats();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', maxWidth: '1200px', margin: '0 auto' }}>
      <aside style={{ width: '280px', borderRight: '1px solid #eee', overflowY: 'auto', flexShrink: 0 }}>
        <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid #eee' }}>Chats</h3>
        {isLoading && <p style={{ padding: '1rem', color: '#888' }}>Loading...</p>}
        {chats && chats.length === 0 && (
          <p style={{ padding: '1rem', color: '#888', fontSize: '0.875rem' }}>No chats yet.</p>
        )}
        {chats?.map((chat) => (
          <button
            key={chat.chatId}
            onClick={() => navigate(`/chat/${chat.chatId}`)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: 'none',
              borderBottom: '1px solid #f0f0f0',
              background: activeId === chat.chatId ? '#eef0ff' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{chat.name || `Chat ${chat.chatId}`}</div>
            {chat.lastMessage && (
              <div style={{ fontSize: '0.8rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {chat.lastMessage.text}
              </div>
            )}
          </button>
        ))}
      </aside>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeId ? <ChatView key={activeId} chatId={activeId} /> : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            Select a chat to start messaging
          </div>
        )}
      </section>
    </div>
  );
}

function ChatView({ chatId }: { chatId: number }) {
  const { items: history, hasMore, loadMore, isFetching } = useMessages(chatId);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { connected, sendMessage } = useChatSocket(chatId, (msg) => {
    setLiveMessages((prev) => [...prev, msg]);
  });

  // Combine: history is paginated (newest first by id descending), reverse for display.
  // Live messages append after history.
  const allMessages = [...history].reverse().concat(liveMessages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText('');
  };

  return (
    <>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/chat" style={{ color: '#646cff', textDecoration: 'none', fontSize: '0.875rem' }}>← All chats</Link>
        <span style={{ fontSize: '0.75rem', color: connected ? '#27ae60' : '#aaa' }}>
          {connected ? '● Connected' : '○ Connecting...'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {hasMore && (
          <button
            onClick={() => loadMore()}
            disabled={isFetching}
            style={{ alignSelf: 'center', padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer' }}
          >
            {isFetching ? 'Loading...' : 'Load older'}
          </button>
        )}
        {allMessages.map((m) => (
          <div key={m.messageId} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#f5f5f5', maxWidth: '70%' }}>
            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#646cff' }}>@{m.senderNickname}</div>
            <div style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>
              {m.isDeleted ? <i style={{ color: '#aaa' }}>[deleted]</i> : m.text}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '0.25rem' }}>
              {new Date(m.sentAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ borderTop: '1px solid #eee', padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={!connected || !text.trim()}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#646cff', color: '#fff', cursor: 'pointer' }}
        >
          Send
        </button>
      </form>
    </>
  );
}
