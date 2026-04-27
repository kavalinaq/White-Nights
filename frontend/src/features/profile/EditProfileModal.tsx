import { useState } from 'react';
import { useUpdateProfile, useUploadAvatar } from './hooks/useProfile';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  onClose: () => void;
}

export const EditProfileModal = ({ profile, onClose }: Props) => {
  const [nickname, setNickname] = useState(profile.nickname);
  const [bio, setBio] = useState(profile.bio || '');
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate);
  
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({ nickname, bio, isPrivate });
    onClose();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar.mutateAsync(file);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-content" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', color: 'black', width: '100%', maxWidth: '400px' }}>
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Avatar:
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </label>
          <input 
            type="text" 
            placeholder="Nickname" 
            value={nickname} 
            onChange={(e) => setNickname(e.target.value)} 
            required 
          />
          <textarea 
            placeholder="Bio" 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
            maxLength={500}
          />
          <label>
            <input 
              type="checkbox" 
              checked={isPrivate} 
              onChange={(e) => setIsPrivate(e.target.checked)} 
            />
            Private Profile
          </label>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={updateProfile.isPending}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};
