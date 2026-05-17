import {useTranslation} from 'react-i18next';
import {useFollowRequests, useHandleFollowRequest} from './hooks/useFollow';

interface Props { onClose: () => void; }

export const FollowRequestsModal = ({ onClose }: Props) => {
  const {t} = useTranslation();
  const { data: requests, isLoading } = useFollowRequests();
  const { accept, reject } = useHandleFollowRequest();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e2d9]">
          <h2 className="font-serif font-bold text-[#1c1714]">{t('profile.followRequests')}</h2>
          <button onClick={onClose} className="text-[#7a6f68] hover:text-[#2d2926] bg-transparent border-none cursor-pointer text-lg leading-none">✕</button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading && <p className="text-[#7a6f68] text-sm text-center p-4">{t('common.loading')}</p>}
          {!isLoading && requests?.length === 0 && <p className="text-[#7a6f68] text-sm text-center p-4">{t('profile.noPendingRequests')}</p>}
          {requests?.map((req: { followerId: number; nickname: string }) => (
            <div key={req.followerId} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#faf7f2]">
              <span className="text-sm font-medium text-[#2d2926]">@{req.nickname}</span>
              <div className="flex gap-2">
                <button onClick={() => accept.mutate(req.followerId)}
                  className="px-3 py-1 rounded-lg bg-[#5b63d3] hover:bg-[#4951c4] text-white text-xs font-medium border-none cursor-pointer transition">
                  {t('profile.accept')}
                </button>
                <button onClick={() => reject.mutate(req.followerId)}
                  className="px-3 py-1 rounded-lg bg-white border border-[#e8e2d9] text-red-500 text-xs font-medium cursor-pointer hover:border-red-300 transition">
                  {t('profile.reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
