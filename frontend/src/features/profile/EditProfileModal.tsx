import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {type Profile, useUpdateProfile, useUploadAvatar} from './hooks/useProfile';

interface Props {
  profile: Profile;
  onClose: () => void;
}

export const EditProfileModal = ({ profile, onClose }: Props) => {
  const {t} = useTranslation();
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
    if (file) await uploadAvatar.mutateAsync(file);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="font-serif text-xl font-bold text-[#1c1714] mb-5">{t('profile.edit')}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#7a6f68] uppercase tracking-wide mb-1.5 block">{t('profile.avatar')}</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange}
              className="text-sm text-[#7a6f68] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#e8e2d9] file:bg-white file:text-sm file:cursor-pointer hover:file:border-[#5b63d3]" />
            {uploadAvatar.isPending && <p className="text-xs text-[#5b63d3] mt-1">{t('common.uploading')}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#7a6f68] uppercase tracking-wide mb-1.5 block">{t('profile.nickname')}</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} required className={inputCls} />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#7a6f68] uppercase tracking-wide mb-1.5 block">{t('profile.bio')}</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={3}
                      placeholder={t('profile.bioPlaceholder')}
              className={inputCls + ' resize-none'} />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 accent-[#5b63d3]" />
            <span className="text-sm text-[#2d2926]">{t('profile.privateCheckbox')}</span>
          </label>

          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] cursor-pointer hover:border-[#5b63d3] transition">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={updateProfile.isPending}
              className="px-4 py-2 rounded-lg bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-semibold border-none cursor-pointer transition disabled:opacity-50">
              {updateProfile.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
