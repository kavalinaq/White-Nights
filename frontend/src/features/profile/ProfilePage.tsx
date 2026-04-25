import { useParams } from 'react-router-dom';
import { useProfile } from './hooks/useProfile';
import { useAuthStore } from '../../shared/store/useAuthStore';
import { useState } from 'react';
import { EditProfileModal } from './EditProfileModal';
import { useFollow, useFollowRequests } from './hooks/useFollow';
import { FollowRequestsModal } from './FollowRequestsModal';

export const ProfilePage = () => {
  const { nickname } = useParams<{ nickname: string }>();
  const { data: profile, isLoading, error } = useProfile(nickname!);
  const { user: currentUser } = useAuthStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  const { follow, unfollow } = useFollow(profile?.userId, profile?.nickname);
  const { data: requests } = useFollowRequests();

  if (isLoading) return <div>Loading profile...</div>;
  if (error) return <div>Error loading profile</div>;
  if (!profile) return <div>User not found</div>;

  const isSelf = currentUser?.nickname === profile.nickname;
  const hasPendingRequests = isSelf && requests && requests.length > 0;

  const renderFollowButton = () => {
    if (isSelf) return null;

    if (profile.followStatus === 'accepted') {
      return <button onClick={() => unfollow.mutate()}>Unfollow</button>;
    }

    if (profile.followStatus === 'pending') {
      return <button disabled>Requested</button>;
    }

    return <button onClick={() => follow.mutate()}>Follow</button>;
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img 
          src={profile.avatarUrl || 'https://via.placeholder.com/150'} 
          alt={profile.nickname} 
          style={{ width: '150px', height: '150px', borderRadius: '50%' }}
        />
        <h1>{profile.nickname}</h1>
        {profile.bio && <p>{profile.bio}</p>}
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
          <span><strong>{profile.postCount}</strong> posts</span>
          <span><strong>{profile.followerCount}</strong> followers</span>
          <span><strong>{profile.followingCount}</strong> following</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {isSelf && (
            <>
              <button onClick={() => setIsEditModalOpen(true)}>Edit Profile</button>
              {hasPendingRequests && (
                <button 
                  onClick={() => setIsRequestsModalOpen(true)}
                  style={{ backgroundColor: '#646cff', color: 'white' }}
                >
                  Follow Requests ({requests.length})
                </button>
              )}
            </>
          )}
          {renderFollowButton()}
        </div>
      </div>

      <div className="profile-content" style={{ marginTop: '2rem' }}>
        {profile.isPrivate && !isSelf && profile.followStatus !== 'accepted' ? (
          <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>This Account is Private</h3>
            <p>Follow to see their posts.</p>
          </div>
        ) : (
          <div className="post-grid">
            <p>No posts yet.</p>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <EditProfileModal 
          profile={profile} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}

      {isRequestsModalOpen && (
        <FollowRequestsModal 
          onClose={() => setIsRequestsModalOpen(false)} 
        />
      )}
    </div>
  );
};
