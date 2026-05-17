import {useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useProfile} from './hooks/useProfile';
import {useMonthlyPages} from './hooks/useMonthlyPages';
import {useAuthStore} from '../../shared/store/useAuthStore';
import {useState} from 'react';
import {EditProfileModal} from './EditProfileModal';
import {useFollow, useFollowRequests} from './hooks/useFollow';
import {FollowRequestsModal} from './FollowRequestsModal';
import {FollowersModal} from './FollowersModal';
import {usePosts} from '../post/hooks/usePosts';
import {PostCard} from '../../shared/components/PostCard';
import {useCreateChat} from '../chat/hooks/useChats';
import {ReportModal} from '../moderation/ReportModal';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import client from '../../shared/api/client';
import {CreatePostModal} from '../post/CreatePostModal';

function useBlockUser(nickname: string | undefined) {
  const queryClient = useQueryClient();
  const block = useMutation({
    mutationFn: () => client.post(`/users/${nickname}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', nickname] }),
  });
  const unblock = useMutation({
    mutationFn: () => client.delete(`/users/${nickname}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', nickname] }),
  });
  return { block, unblock };
}

export const ProfilePage = () => {
  const { nickname } = useParams<{ nickname: string }>();
  const { data: profile, isLoading, error } = useProfile(nickname!);
  const {data: monthlyPages} = useMonthlyPages(nickname);
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const {t} = useTranslation();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);
  const [reportPostId, setReportPostId] = useState<number | null>(null);
  const [showReportUser, setShowReportUser] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const { follow, unfollow } = useFollow(profile?.userId, profile?.nickname);
  const { data: requests } = useFollowRequests();
  const createChat = useCreateChat();
  const { block, unblock } = useBlockUser(nickname);

  const isSelf = currentUser?.nickname === profile?.nickname;
  const canSeePosts = isSelf || !profile?.isPrivate || profile?.followStatus === 'accepted';
  const { items: posts, hasMore, loadMore, isFetching } = usePosts(canSeePosts ? profile?.userId : undefined);
  const hasPendingRequests = isSelf && requests && requests.length > 0;

  if (isLoading) return <div className="px-8 py-12 text-center text-[#7a6f68]">{t('common.loading')}</div>;
  if (error) return <div className="px-8 py-12 text-center text-red-500">{t('profile.errorLoading')}</div>;
  if (!profile) return <div className="px-8 py-12 text-center text-[#7a6f68]">{t('profile.userNotFound')}</div>;

  const handleMessage = async () => {
    const result = await createChat.mutateAsync({ peerId: profile.userId });
    navigate(`/chat/${result.data.chatId}`);
  };

  const renderFollowButton = () => {
    if (isSelf) return null;
    if (profile.followStatus === 'accepted')
      return <button onClick={() => unfollow.mutate()}
                     className="px-4 py-1.5 rounded-full border border-[#e8e2d9] bg-white text-sm font-medium text-[#7a6f68] cursor-pointer hover:border-red-300 hover:text-red-500 transition">{t('profile.unfollow')}</button>;
    if (profile.followStatus === 'pending')
      return <button disabled className="px-4 py-1.5 rounded-full border border-[#e8e2d9] bg-white text-sm font-medium text-[#7a6f68] opacity-60 cursor-not-allowed">{t('profile.requested')}</button>;
    return <button onClick={() => follow.mutate()}
                   className="px-4 py-1.5 rounded-full bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-semibold border-none cursor-pointer transition">{t('profile.follow')}</button>;
  };

  return (
      <div className="px-8 py-8">
        {/* Profile header — avatar left 1/3, info right 2/3 */}
        <div className="bg-white rounded-2xl border border-[#e8e2d9] shadow-sm p-6 mb-6">
          <div className="flex gap-6">
            {/* Avatar — 1/3 */}
            <div className="w-1/3 flex items-center justify-center flex-shrink-0">
              {profile.avatarUrl
                  ? <img src={profile.avatarUrl} alt={profile.nickname} className="w-44 h-44 rounded-full object-cover border-4 border-[#e8e2d9]" />
                  : <div className="w-44 h-44 rounded-full bg-[#e8e2d9] border-4 border-white flex items-center justify-center text-6xl text-[#7a6f68]">📚</div>
              }
            </div>
            {/* Info — 2/3 */}
            <div className="flex-1 flex flex-col justify-center gap-3">
              <h1 className="font-serif text-xl font-bold text-[#1c1714]">{profile.nickname}</h1>
              {profile.bio && <p className="text-sm text-[#7a6f68] max-w-sm">{profile.bio}</p>}

              {/* Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="font-bold text-[#1c1714]">{profile.postCount}</div>
                  <div className="text-xs text-[#7a6f68]">{t('profile.posts')}</div>
                </div>
                <button onClick={() => setFollowModal('followers')} className="text-center bg-transparent border-none cursor-pointer p-0 hover:opacity-70 transition">
                  <div className="font-bold text-[#1c1714]">{profile.followerCount}</div>
                  <div className="text-xs text-[#7a6f68]">{t('profile.followers')}</div>
                </button>
                <button onClick={() => setFollowModal('following')} className="text-center bg-transparent border-none cursor-pointer p-0 hover:opacity-70 transition">
                  <div className="font-bold text-[#1c1714]">{profile.followingCount}</div>
                  <div className="text-xs text-[#7a6f68]">{t('profile.following')}</div>
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {isSelf ? (
                    <>
                      <button onClick={() => setIsEditModalOpen(true)}
                              className="px-4 py-1.5 rounded-full border border-[#e8e2d9] bg-white text-sm font-medium text-[#2d2926] cursor-pointer hover:border-[#5b63d3] hover:text-[#5b63d3] transition">{t('profile.edit')}</button>
                      <button
                          onClick={() => setShowCreatePost(true)}
                          className="px-4 py-1.5 rounded-full bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-semibold border-none cursor-pointer transition"
                      >
                        + {t('profile.newPost')}
                      </button>
                      {hasPendingRequests && (
                          <button onClick={() => setIsRequestsModalOpen(true)} className="px-4 py-1.5 rounded-full bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-semibold border-none cursor-pointer transition">
                            {t('profile.requests')} ({requests.length})
                          </button>
                      )}
                    </>
                ) : (
                    <>
                      {renderFollowButton()}
                      {currentUser && (
                          <button onClick={handleMessage} disabled={createChat.isPending}
                                  className="px-4 py-1.5 rounded-full border border-[#e8e2d9] bg-white text-sm font-medium text-[#2d2926] cursor-pointer hover:border-[#5b63d3] hover:text-[#5b63d3] transition disabled:opacity-50">
                            {createChat.isPending ? '…' : t('profile.message')}
                          </button>
                      )}
                      {currentUser && (
                          <button
                              onClick={() => profile.isBlocked ? unblock.mutate() : block.mutate()}
                              disabled={block.isPending || unblock.isPending}
                              className="px-4 py-1.5 rounded-full border border-[#e8e2d9] bg-white text-sm font-medium text-[#7a6f68] cursor-pointer hover:border-red-300 hover:text-red-500 transition disabled:opacity-50"
                          >
                            {profile.isBlocked ? t('profile.unblock') : t('profile.block')}
                          </button>
                      )}
                      {currentUser && (
                          <button onClick={() => setShowReportUser(true)}
                                  className="px-4 py-1.5 rounded-full border border-[#e8e2d9] bg-white text-sm font-medium text-[#b0a9a1] cursor-pointer hover:border-red-300 hover:text-red-400 transition">
                            ⚑ {t('common.report')}
                          </button>
                      )}
                    </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly pages banner */}
        {monthlyPages && (
            <div className="mb-6 rounded-2xl shadow-md bg-gradient-to-r from-[#5b63d3] via-[#7e85e4] to-[#d35b9b] text-white px-6 py-5 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-85 font-semibold">📖 {t('tracker.title')}</div>
                <div className="text-lg sm:text-xl font-bold mt-1">
                  {isSelf
                      ? t('profile.monthlyPagesSelf', {pages: monthlyPages.pagesRead})
                      : t('profile.monthlyPages', {nickname: profile.nickname, pages: monthlyPages.pagesRead})}
                </div>
              </div>
              <div className="text-4xl sm:text-5xl font-bold opacity-90">{monthlyPages.pagesRead}</div>
            </div>
        )}

        {/* Posts */}
        {!canSeePosts ? (
            <div className="bg-white rounded-2xl border border-[#e8e2d9] p-10 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-serif font-bold text-[#1c1714] mb-1">{t('profile.privateTitle')}</h3>
              <p className="text-sm text-[#7a6f68]">{t('profile.privateHint')}</p>
            </div>
        ) : (
            <>
              {posts.length === 0 && !isFetching && (
                  <div className="text-center py-12 text-[#7a6f68]">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-sm">{t('profile.noPosts')}</p>
                  </div>
              )}
              <div className="space-y-4">
                {posts.map((post) => <PostCard key={post.postId} post={post} onReport={(id) => setReportPostId(id)} />)}
              </div>
              {hasMore && (
                  <button onClick={() => loadMore()} disabled={isFetching}
                          className="mt-5 w-full py-2.5 rounded-xl border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] hover:border-[#5b63d3] hover:text-[#5b63d3] cursor-pointer transition disabled:opacity-50">
                    {isFetching ? t('common.loading') : t('common.loadMore')}
                  </button>
              )}
            </>
        )}

        {isEditModalOpen && <EditProfileModal profile={profile} onClose={() => setIsEditModalOpen(false)} />}
        {isRequestsModalOpen && <FollowRequestsModal onClose={() => setIsRequestsModalOpen(false)} />}
        {followModal && <FollowersModal userId={profile.userId} initialTab={followModal} onClose={() => setFollowModal(null)} />}
        {reportPostId !== null && <ReportModal targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />}
        {showReportUser && <ReportModal targetType="user" targetId={profile.userId} onClose={() => setShowReportUser(false)} />}
        {showCreatePost && <CreatePostModal onClose={() => setShowCreatePost(false)} />}
      </div>
  );
};