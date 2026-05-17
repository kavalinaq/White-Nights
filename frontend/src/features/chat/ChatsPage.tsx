import {useEffect, useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {type ChatMessage, type ChatPreview, useChats, useCreateChat, useDeleteChat, useDeleteMessage} from './hooks/useChats';
import {GroupInfoModal} from './GroupInfoModal';
import {extractApiError} from '../../shared/api/extractApiError';
import {useMessages} from './hooks/useMessages';
import {useChatSocket} from './hooks/useChatSocket';
import {useAuthStore} from '../../shared/store/useAuthStore';
import {isUnread, useUnreadStore} from '../../shared/store/useUnreadStore';
import client from '../../shared/api/client';

interface UserSuggestion {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
}

function useUserSuggestions(query: string) {
  return useQuery({
    queryKey: ['user-suggestions', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await client.get<{ users: UserSuggestion[] }>('/search', { params: { q: query } });
      return res.data.users.slice(0, 6);
    },
    enabled: query.trim().length >= 1,
    staleTime: 5000,
  });
}

export function ChatsPage() {
  const {t} = useTranslation();
  const { id } = useParams<{ id: string }>();
  const activeId = id ? Number(id) : undefined;
  const { data: chats, isLoading } = useChats();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { lastSeenAt } = useUnreadStore();

  const [showNewChat, setShowNewChat] = useState(false);
  const [chatMode, setChatMode] = useState<'direct' | 'group'>('direct');

  // Direct chat state
  const [peerNickname, setPeerNickname] = useState('');
  const [newChatError, setNewChatError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Group chat state
  const [groupName, setGroupName] = useState('');
  const [groupMemberInput, setGroupMemberInput] = useState('');
  const [groupMembers, setGroupMembers] = useState<UserSuggestion[]>([]);
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
  const [groupChatError, setGroupChatError] = useState('');

  const createChat = useCreateChat();

  const { data: directSuggestions } = useUserSuggestions(peerNickname);
  const { data: groupSuggestions } = useUserSuggestions(groupMemberInput);

  const activeChat = chats?.find((c) => c.chatId === activeId);

  const totalUnread = (chats ?? []).filter((c) =>
    isUnread(c.lastMessage, c.chatId, user?.nickname, lastSeenAt)
  ).length;

  const handleNewDirectChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewChatError('');
    try {
      const profileRes = await client.get(`/users/${peerNickname.trim()}`);
      const peerId: number = profileRes.data.userId;
      const result = await createChat.mutateAsync({ peerId });
      setPeerNickname(''); setShowNewChat(false);
      navigate(`/chat/${result.data.chatId}`);
    } catch (err: unknown) {
      const msg = extractApiError(err);
      setNewChatError(msg || t('chat.userNotFoundOrError'));
    }
  };

  const handleAddGroupMember = (u: UserSuggestion) => {
    if (!groupMembers.find((m) => m.userId === u.userId)) {
      setGroupMembers((prev) => [...prev, u]);
    }
    setGroupMemberInput('');
    setShowGroupSuggestions(false);
  };

  const handleNewGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupChatError('');
    if (!groupName.trim()) {
      setGroupChatError(t('chat.groupNameRequired'));
      return;
    }
    try {
      const result = await createChat.mutateAsync({
        name: groupName.trim(),
        memberIds: groupMembers.map((m) => m.userId),
      });
      setGroupName(''); setGroupMembers([]); setGroupMemberInput(''); setShowNewChat(false);
      navigate(`/chat/${result.data.chatId}`);
    } catch (err: unknown) {
      const msg = extractApiError(err);
      setGroupChatError(msg || t('chat.errorCreatingGroup'));
    }
  };

  // Expose totalUnread for parent (App.tsx reads from store directly)
  void totalUnread;

  return (
    <div className="flex h-full border-r border-[#e8e2d9]">
      {/* Sidebar */}
      <aside className={`w-72 flex-shrink-0 border-r border-[#e8e2d9] bg-white flex flex-col ${activeId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="px-4 py-3 border-b border-[#e8e2d9] flex items-center justify-between">
          <h3 className="font-serif font-bold text-[#1c1714]">{t('chat.messagesHeader')}</h3>
          <button
            onClick={() => { setShowNewChat((v) => !v); setNewChatError(''); setGroupChatError(''); }}
            className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition
              ${showNewChat ? 'bg-[#5b63d3] border-[#5b63d3] text-white' : 'border-[#5b63d3] text-[#5b63d3] bg-white hover:bg-[#5b63d3] hover:text-white'}`}
          >
            + {t('chat.new')}
          </button>
        </div>

        {showNewChat && (
          <div className="px-3 py-3 border-b border-[#e8e2d9] flex flex-col gap-2">
            {/* Mode tabs */}
            <div className="flex rounded-lg overflow-hidden border border-[#e8e2d9]">
              <button
                type="button"
                onClick={() => { setChatMode('direct'); setNewChatError(''); }}
                className={`flex-1 py-1.5 text-xs font-medium transition cursor-pointer border-none ${chatMode === 'direct' ? 'bg-[#5b63d3] text-white' : 'bg-white text-[#7a6f68] hover:bg-[#faf7f2]'}`}
              >
                {t('chat.direct')}
              </button>
              <button
                type="button"
                onClick={() => { setChatMode('group'); setGroupChatError(''); }}
                className={`flex-1 py-1.5 text-xs font-medium transition cursor-pointer border-none ${chatMode === 'group' ? 'bg-[#5b63d3] text-white' : 'bg-white text-[#7a6f68] hover:bg-[#faf7f2]'}`}
              >
                {t('chat.group')}
              </button>
            </div>

            {chatMode === 'direct' ? (
              <form onSubmit={handleNewDirectChat} className="flex flex-col gap-2">
                <div className="relative">
                  <input
                    autoFocus value={peerNickname}
                    onChange={(e) => { setPeerNickname(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder={t('chat.enterUsername')} required
                    className="w-full px-3 py-2 rounded-lg border border-[#e8e2d9] bg-[#faf7f2] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition"
                  />
                  {showSuggestions && directSuggestions && directSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[#e8e2d9] rounded-lg shadow-lg mt-1 overflow-hidden">
                      {directSuggestions.map((u) => (
                        <button
                          key={u.userId} type="button"
                          onMouseDown={() => { setPeerNickname(u.nickname); setShowSuggestions(false); }}
                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#eef0ff] cursor-pointer border-none bg-white transition"
                        >
                          {u.avatarUrl
                            ? <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                            : <div className="w-6 h-6 rounded-full bg-[#e8e2d9] flex-shrink-0" />}
                          <span className="font-medium text-[#2d2926]">@{u.nickname}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {newChatError && <p className="text-red-500 text-xs">{newChatError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowNewChat(false)}
                    className="flex-1 py-2 rounded-lg border border-[#e8e2d9] text-sm text-[#7a6f68] cursor-pointer transition hover:border-[#5b63d3]">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={createChat.isPending || !peerNickname.trim()}
                    className="flex-1 py-2 rounded-lg bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-medium border-none cursor-pointer transition disabled:opacity-50">
                    {createChat.isPending ? t('chat.startingChat') : t('chat.startChat')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleNewGroupChat} className="flex flex-col gap-2">
                <input
                  autoFocus value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={t('chat.groupNamePlaceholder')} required
                  className="w-full px-3 py-2 rounded-lg border border-[#e8e2d9] bg-[#faf7f2] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition"
                />
                <div className="relative">
                  <input
                    value={groupMemberInput}
                    onChange={(e) => { setGroupMemberInput(e.target.value); setShowGroupSuggestions(true); }}
                    onFocus={() => setShowGroupSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowGroupSuggestions(false), 150)}
                    placeholder={t('chat.addMembersPlaceholder')}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8e2d9] bg-[#faf7f2] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition"
                  />
                  {showGroupSuggestions && groupSuggestions && groupSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[#e8e2d9] rounded-lg shadow-lg mt-1 overflow-hidden">
                      {groupSuggestions
                        .filter((u) => !groupMembers.find((m) => m.userId === u.userId))
                        .map((u) => (
                          <button
                            key={u.userId} type="button"
                            onMouseDown={() => handleAddGroupMember(u)}
                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#eef0ff] cursor-pointer border-none bg-white transition"
                          >
                            {u.avatarUrl
                              ? <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                              : <div className="w-6 h-6 rounded-full bg-[#e8e2d9] flex-shrink-0" />}
                            <span className="font-medium text-[#2d2926]">@{u.nickname}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {groupMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {groupMembers.map((m) => (
                      <span key={m.userId} className="flex items-center gap-1 text-xs bg-[#eef0ff] text-[#5b63d3] px-2 py-0.5 rounded-full">
                        @{m.nickname}
                        <button
                          type="button"
                          onClick={() => setGroupMembers((prev) => prev.filter((x) => x.userId !== m.userId))}
                          className="cursor-pointer text-[#5b63d3] hover:text-red-500 bg-transparent border-none p-0 ml-0.5 leading-none"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
                {groupChatError && <p className="text-red-500 text-xs">{groupChatError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowNewChat(false)}
                    className="flex-1 py-2 rounded-lg border border-[#e8e2d9] text-sm text-[#7a6f68] cursor-pointer transition hover:border-[#5b63d3]">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={createChat.isPending || !groupName.trim()}
                    className="flex-1 py-2 rounded-lg bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-medium border-none cursor-pointer transition disabled:opacity-50">
                    {createChat.isPending ? t('chat.creatingGroup') : t('chat.createGroup')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-[#f3ede4] rounded-lg animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && chats?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-[#b0a9a1] gap-2">
              <span className="text-3xl">💬</span>
              <p className="text-xs">{t('chat.noConversations')}</p>
            </div>
          )}
          {chats?.map((chat) => (
            <ChatListItem
              key={chat.chatId}
              chat={chat}
              isActive={activeId === chat.chatId}
              unread={isUnread(chat.lastMessage, chat.chatId, user?.nickname, lastSeenAt)}
              onClick={() => navigate(`/chat/${chat.chatId}`)}
            />
          ))}
        </div>
      </aside>

      {/* Main area */}
      <section className="flex-1 flex flex-col bg-[#faf7f2] min-w-0">
        {activeId ? (
          <ChatView
            key={activeId}
            chatId={activeId}
            chatName={activeChat?.name ?? `Chat ${activeId}`}
            isGroup={activeChat?.isGroup ?? true}
            activeChat={activeChat}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#7a6f68] gap-3">
            <span className="text-5xl">💬</span>
            <p className="text-sm font-medium">{t('chat.selectConversation')}</p>
            <p className="text-xs text-[#b0a9a1]">{t('chat.selectChatHint')}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ChatListItem({
  chat, isActive, unread, onClick,
}: {
  chat: ChatPreview; isActive: boolean; unread: boolean; onClick: () => void;
}) {
  const {t} = useTranslation();
  const lastText = chat.lastMessage
      ? (chat.lastMessage.isDeleted ? `[${t('common.delete')}]` : (chat.lastMessage.text ?? (chat.lastMessage.imageUrl ? '📷' : '')))
    : null;

  const initials = (chat.name ?? '?').slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-3 text-left border-none border-b border-[#f3ede4] cursor-pointer transition flex items-center gap-3
        ${isActive ? 'bg-[#eef0ff]' : 'bg-white hover:bg-[#faf7f2]'}`}
    >
      {chat.avatarUrl ? (
          <img
              src={chat.avatarUrl}
              alt={chat.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
      ) : (
          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold
          ${isActive ? 'bg-[#5b63d3] text-white' : 'bg-[#e8e2d9] text-[#7a6f68]'}`}>
            {initials}
          </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold truncate ${isActive ? 'text-[#5b63d3]' : 'text-[#2d2926]'}`}>
          {chat.name || `Chat ${chat.chatId}`}
        </div>
        {lastText
          ? <div className={`text-xs truncate ${unread && !isActive ? 'text-[#2d2926] font-medium' : 'text-[#b0a9a1]'}`}>{lastText}</div>
            : <div className="text-xs text-[#b0a9a1] italic">{t('chat.noMessages')}</div>
        }
      </div>
      {unread && !isActive && (
        <span className="w-2.5 h-2.5 rounded-full bg-[#5b63d3] flex-shrink-0" />
      )}
    </button>
  );
}

function ChatView({chatId, chatName, isGroup, activeChat}: { chatId: number; chatName: string; isGroup: boolean; activeChat?: ChatPreview }) {
  const {t} = useTranslation();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const { items: history, hasMore, loadMore, isFetching } = useMessages(chatId);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [messagePatches, setMessagePatches] = useState<Record<number, Partial<ChatMessage>>>({});
  const [text, setText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const deleteChat = useDeleteChat();
  const deleteMessage = useDeleteMessage();
  const { markRead } = useUnreadStore();

  const { connected, sendMessage } = useChatSocket(chatId, (msg) => {
    setLiveMessages((prev) => {
      const exists = prev.find((m) => m.messageId === msg.messageId);
      if (exists) return prev.map((m) => m.messageId === msg.messageId ? msg : m);
      return [...prev, msg];
    });
    if (msg.isDeleted) {
      setMessagePatches((prev) => ({ ...prev, [msg.messageId]: { isDeleted: true, text: null, imageUrl: null } }));
    }
  });

  const { data: presenceData } = useQuery({
    queryKey: ['presence', chatName],
    queryFn: () => client.get<{ online: boolean }>(`/users/${chatName}/online`).then((r) => r.data),
    enabled: !isGroup && !!chatName,
    refetchInterval: 30000,
  });
  const isPeerOnline = presenceData?.online ?? false;

  const allMessages = [...history].reverse().concat(liveMessages).map((m) =>
    messagePatches[m.messageId] ? { ...m, ...messagePatches[m.messageId] } : m
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [chatId]);

  // Mark chat as read when viewing
  useEffect(() => {
    markRead(chatId);
  }, [chatId, markRead, allMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText('');
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await client.post(`/chats/${chatId}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch {
      // image display handled via WS broadcast
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    // Optimistically mark deleted
    setMessagePatches((prev) => ({ ...prev, [messageId]: { isDeleted: true, text: null, imageUrl: null } }));
    setLiveMessages((prev) => prev.map((m) =>
      m.messageId === messageId ? { ...m, isDeleted: true, text: null, imageUrl: null } : m
    ));
    try {
      await deleteMessage.mutateAsync(messageId);
    } catch {
      // rollback patch on failure
      setMessagePatches((prev) => {
        const copy = { ...prev };
        delete copy[messageId];
        return copy;
      });
    }
  };

  const handleDeleteChat = async () => {
    if (!confirm(t('chat.deleteChatConfirmFull'))) return;
    await deleteChat.mutateAsync(chatId);
    navigate('/chat');
  };

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-[#e8e2d9] flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate('/chat')}
          className="sm:hidden text-[#7a6f68] hover:text-[#5b63d3] bg-transparent border-none cursor-pointer text-lg leading-none transition"
        >
          ←
        </button>
        {isGroup && activeChat?.avatarUrl ? (
            <button
                onClick={() => setShowGroupInfo(true)}
                className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-none p-0 bg-transparent cursor-pointer"
                title={t('chat.groupInfo')}
            >
              <img src={activeChat.avatarUrl} alt={chatName} className="w-full h-full object-cover"/>
            </button>
        ) : (
            <button
                onClick={() => isGroup && setShowGroupInfo(true)}
                disabled={!isGroup}
                className="w-8 h-8 rounded-full bg-[#e8e2d9] flex items-center justify-center text-xs font-bold text-[#7a6f68] flex-shrink-0 border-none p-0 cursor-pointer disabled:cursor-default"
            >
              {chatName.slice(0, 2).toUpperCase()}
            </button>
        )}
        <div className="flex-1 min-w-0">
          {!isGroup ? (
            <Link to={`/u/${chatName}`} className="font-semibold text-sm text-[#1c1714] hover:text-[#5b63d3] transition truncate block">
              {chatName}
            </Link>
          ) : (
              <button
                  onClick={() => setShowGroupInfo(true)}
                  className="font-semibold text-sm text-[#1c1714] hover:text-[#5b63d3] transition truncate block w-full text-left bg-transparent border-none p-0 cursor-pointer"
              >
                {chatName}
              </button>
          )}
          {!isGroup && (
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isPeerOnline ? 'bg-green-500' : 'bg-[#d0c9c1]'}`} />
              <span className="text-xs text-[#b0a9a1]">{isPeerOnline ? t('chat.online') : t('chat.offline')}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleDeleteChat}
          disabled={deleteChat.isPending}
          className="text-xs text-[#b0a9a1] hover:text-red-500 bg-transparent border-none cursor-pointer transition disabled:opacity-50 flex-shrink-0"
          title={t('chat.deleteChat')}
        >
          🗑
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {hasMore && (
          <button onClick={() => loadMore()} disabled={isFetching}
            className="self-center px-4 py-1.5 text-xs rounded-full border border-[#e8e2d9] bg-white text-[#7a6f68] cursor-pointer hover:border-[#5b63d3] transition disabled:opacity-50">
            {isFetching ? t('common.loading') : t('chat.loadOlder')}
          </button>
        )}

        {allMessages.length === 0 && !isFetching && (
          <div className="flex-1 flex flex-col items-center justify-center text-[#b0a9a1] gap-2 py-16">
            <span className="text-4xl">👋</span>
            <p className="text-sm">{t('chat.sayHello')}</p>
          </div>
        )}

        {allMessages.map((m) => {
          const isOwn = m.senderNickname === user?.nickname;
          const alreadyDeleted = m.isDeleted;
          return (
            <div key={m.messageId} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
              <div className="relative flex items-end gap-1">
                {isOwn && !alreadyDeleted && (
                  <button
                    onClick={() => handleDeleteMessage(m.messageId)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#b0a9a1] hover:text-red-500 bg-transparent border-none cursor-pointer p-1 flex-shrink-0 order-first"
                    title={t('chat.deleteMessage')}
                  >
                    🗑
                  </button>
                )}
                <div className={`max-w-[100%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                  isOwn
                    ? 'bg-[#5b63d3] text-white rounded-br-sm'
                    : 'bg-white border border-[#e8e2d9] text-[#2d2926] rounded-bl-sm'
                }`}>
                  {!isOwn && (
                    <div className="text-[11px] font-semibold text-[#5b63d3] mb-0.5">@{m.senderNickname}</div>
                  )}
                  <div className="text-sm break-words leading-relaxed">
                    {alreadyDeleted
                        ? <i className={isOwn ? 'opacity-60 text-xs' : 'text-[#b0a9a1] text-xs'}>{t('chat.messageDeleted')}</i>
                      : m.imageUrl
                        ? <img src={m.imageUrl} alt="photo" className="max-w-full rounded-lg max-h-64 object-contain" />
                        : m.text}
                  </div>
                  <div className={`text-[10px] mt-1 leading-none ${isOwn ? 'text-white/50 text-right' : 'text-[#b0a9a1]'}`}>
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#e8e2d9] flex gap-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <button
          type="button"
          disabled={!connected || uploadingImage}
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-full border border-[#e8e2d9] bg-white text-[#7a6f68] hover:border-[#5b63d3] hover:text-[#5b63d3] flex items-center justify-center cursor-pointer transition disabled:opacity-40 flex-shrink-0 text-base"
          title={t('chat.sendPhoto')}
        >
          {uploadingImage ? '…' : '📷'}
        </button>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={connected ? t('chat.typeMessage') : t('chat.connecting')}
          disabled={!connected}
          className="flex-1 px-4 py-2.5 rounded-full border border-[#e8e2d9] bg-[#faf7f2] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!connected || !text.trim()}
          className="w-10 h-10 rounded-full bg-[#5b63d3] hover:bg-[#4951c4] text-white flex items-center justify-center border-none cursor-pointer transition disabled:opacity-40 flex-shrink-0 text-base"
        >
          ↑
        </button>
      </form>
      {showGroupInfo && activeChat && (
          <GroupInfoModal chat={activeChat} onClose={() => setShowGroupInfo(false)}/>
      )}
    </>
  );
}
