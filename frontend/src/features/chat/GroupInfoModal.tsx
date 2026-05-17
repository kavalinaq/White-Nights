import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {type ChatPreview, useChatMembers, useUpdateChatAvatar} from './hooks/useChats';
import {useAuthStore} from '../../shared/store/useAuthStore';

interface Props {
  chat: ChatPreview;
  onClose: () => void;
}

export function GroupInfoModal({chat, onClose}: Props) {
  const {t} = useTranslation();
  const {user} = useAuthStore();
  const {data: members, isLoading} = useChatMembers(chat.chatId);
  const updateAvatar = useUpdateChatAvatar(chat.chatId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canEdit = !!user && chat.ownerId === user.id;
  const avatarSrc = previewUrl || chat.avatarUrl;

  const handleFile = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    await updateAvatar.mutateAsync(file);
  };

  return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl font-bold text-[#2d2926]">{t('chat.groupInfo')}</h2>
            <button onClick={onClose} className="text-[#7a6f68] hover:text-[#2d2926] text-2xl leading-none">×</button>
          </div>

          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              {avatarSrc ? (
                  <img src={avatarSrc} alt={chat.name} className="w-28 h-28 rounded-full object-cover border-4 border-[#e8e2d9]"/>
              ) : (
                  <div className="w-28 h-28 rounded-full bg-[#e8e2d9] flex items-center justify-center text-4xl">👥</div>
              )}
              {canEdit && (
                  <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 bg-[#5b63d3] text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-[#4951c4] text-sm shadow-md"
                      title={t('chat.editAvatar')}
                  >
                    ✎
                  </button>
              )}
              <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
              />
            </div>
            <div className="font-serif text-xl font-bold mt-3 text-[#1c1714]">{chat.name}</div>
            <div className="text-xs text-[#7a6f68] mt-1">
              {t('chat.memberCount', {count: members?.length ?? chat.memberCount})}
            </div>
          </div>

          <div className="border-t border-[#e8e2d9] pt-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#7a6f68] mb-3">{t('chat.members')}</h3>
            {isLoading ? (
                <div className="text-sm text-[#7a6f68]">{t('common.loading')}</div>
            ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {(members ?? []).map((m) => (
                      <li key={m.userId}>
                        <Link
                            to={`/u/${m.nickname}`}
                            onClick={onClose}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#faf8f5] transition-colors"
                        >
                          {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt={m.nickname} className="w-9 h-9 rounded-full object-cover"/>
                          ) : (
                              <div className="w-9 h-9 rounded-full bg-[#e8e2d9] flex items-center justify-center text-sm">📚</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[#2d2926] truncate">@{m.nickname}</div>
                            <div className="text-xs text-[#7a6f68]">
                              {m.role === 'owner' ? t('chat.owner') : t('chat.member')}
                            </div>
                          </div>
                        </Link>
                      </li>
                  ))}
                </ul>
            )}
          </div>
        </div>
      </div>
  );
}
