import { useParams } from 'react-router-dom';
import { useProfile } from './hooks/useProfile';
import { useAuthStore } from '../../shared/store/useAuthStore';
import { useState } from 'react';
import { EditProfileModal } from './EditProfileModal';

export const ProfilePage = () => {
  const { nickname } = useParams<{ nickname: string }>();
  const { data: profile, isLoading, error } = useProfile(nickname!);
  const { user: currentUser } = useAuthStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) return <div>Loading profile...</div>;
  if (error) return <div>Error loading profile</div>;
  if (!profile) return <div>User not found</div>;

  const isSelf = currentUser?.nickname === profile.nickname;

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
        <p>Posts: {profile.postCount}</p>
        {isSelf && (
          <button onClick={() => setIsEditModalOpen(true)}>Edit Profile</button>
        )}
      </div>

      <div className="profile-content">
        {profile.isPrivate && !isSelf ? (
          <p>This profile is private</p>
        ) : (
          <div className="post-grid">
            {/* Grid of posts will land with Feature 04 */}
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
    </div>
  );
};
