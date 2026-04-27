import { useState } from 'react';
import type { Post } from '../../shared/components/PostCard';
import { useUpdatePost } from './hooks/usePostMutations';

interface Props {
  post: Post;
  onClose: () => void;
}

export function EditPostModal({ post, onClose }: Props) {
  const [title, setTitle] = useState(post.title);
  const [author, setAuthor] = useState(post.author);
  const [description, setDescription] = useState(post.description);
  const [tagInput, setTagInput] = useState(post.tags.map((t) => t.name).join(', '));
  const [image, setImage] = useState<File | null>(null);

  const updatePost = useUpdatePost(post.postId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagNames = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await updatePost.mutateAsync({ title, author, description, tagNames, image });
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '480px' }}>
        <h2 style={{ marginTop: 0 }}>Edit post</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            placeholder="Book title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <input
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            maxLength={120}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <textarea
            placeholder="Your review or quote"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
          />
          <input
            placeholder="Tags (comma-separated)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: '#666' }}>Replace image (optional)</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </div>
          {updatePost.error && (
            <p style={{ color: 'red', margin: 0, fontSize: '0.875rem' }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(updatePost.error as any).response?.data?.detail || 'Failed to update post'}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', background: '#f5f5f5' }}>
              Cancel
            </button>
            <button type="submit" disabled={updatePost.isPending} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#646cff', color: '#fff', cursor: 'pointer' }}>
              {updatePost.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
