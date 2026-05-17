import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useCreatePost} from './hooks/usePostMutations';
import {extractApiError} from '../../shared/api/extractApiError';

interface Props { onClose: () => void; }

export function CreatePostModal({ onClose }: Props) {
  const {t} = useTranslation();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const createPost = useCreatePost();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagNames = tagInput.split(',').map((s) => s.trim()).filter(Boolean);
    await createPost.mutateAsync({ title, author, description, tagNames, image });
    onClose();
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="font-serif text-xl font-bold text-[#1c1714] mb-5">{t('feed.newPost')}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input placeholder={t('feed.bookTitle')} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} className={inputCls}/>
          <input placeholder={t('feed.bookAuthor')} value={author} onChange={(e) => setAuthor(e.target.value)} required maxLength={120} className={inputCls}/>
          <textarea placeholder={t('feed.review')} value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className={inputCls + ' resize-y'}/>
          <input placeholder={t('feed.tagsHint')} value={tagInput} onChange={(e) => setTagInput(e.target.value)} className={inputCls}/>

          <div>
            <label className="text-xs text-[#7a6f68] mb-1.5 block">{t('feed.coverOptional')}</label>
            {preview && (
              <div className="relative mb-2">
                <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-lg border border-[#e8e2d9]" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center border-none cursor-pointer hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange}
              className="text-sm text-[#7a6f68] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#e8e2d9] file:bg-white file:text-sm file:cursor-pointer hover:file:border-[#5b63d3]" />
          </div>

          {createPost.error && (
            <p className="text-red-500 text-sm">
              {extractApiError(createPost.error) ?? t('feed.failedToCreate')}
            </p>
          )}
          <div className="flex gap-2 justify-end mt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] cursor-pointer hover:border-[#5b63d3] transition">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={createPost.isPending}
              className="px-4 py-2 rounded-lg bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-semibold border-none cursor-pointer transition disabled:opacity-50">
              {createPost.isPending ? t('feed.publishing') : t('feed.publish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
