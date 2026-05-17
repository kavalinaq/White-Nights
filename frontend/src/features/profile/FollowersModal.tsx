import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useFollowers, useFollowing} from './hooks/useFollow';

interface Props {
  userId: number;
  initialTab: 'followers' | 'following';
  onClose: () => void;
}

export function FollowersModal({ userId, initialTab, onClose }: Props) {
  const {t} = useTranslation();
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
  const { data: followers, isLoading: loadingFollowers } = useFollowers(userId);
  const { data: following, isLoading: loadingFollowing } = useFollowing(userId);

  const items = tab === 'followers' ? followers : following;
  const isLoading = tab === 'followers' ? loadingFollowers : loadingFollowing;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
        <div className="flex border-b border-[#e8e2d9] flex-shrink-0">
          {(['followers', 'following'] as const).map((key) => (
              <button key={key} onClick={() => setTab(key)}
                      className={`flex-1 py-3 text-sm font-medium border-none cursor-pointer transition
                ${tab === key ? 'text-[#5b63d3] border-b-2 border-[#5b63d3] bg-white' : 'text-[#7a6f68] bg-white hover:text-[#2d2926]'}`}
            >
                {t(`profile.${key}`)}
            </button>
          ))}
          <button onClick={onClose} className="px-4 text-[#7a6f68] hover:text-[#2d2926] bg-white border-none cursor-pointer text-lg">✕</button>
        </div>

        <div className="overflow-y-auto py-1">
          {isLoading && <p className="text-[#7a6f68] text-sm text-center py-6">{t('common.loading')}</p>}
          {!isLoading && items?.length === 0 && (
            <p className="text-[#7a6f68] text-sm text-center py-6">
              {tab === 'followers' ? t('profile.noFollowers') : t('profile.noFollowing')}
            </p>
          )}
          {items?.map((u) => (
            <Link key={u.userId} to={`/u/${u.nickname}`} onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-[#faf7f2] transition">
              {u.avatarUrl
                ? <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                : <div className="w-10 h-10 rounded-full bg-[#e8e2d9] flex-shrink-0" />}
              <span className="font-semibold text-sm text-[#2d2926]">@{u.nickname}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
