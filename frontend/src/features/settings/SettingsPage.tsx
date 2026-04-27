import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedPosts, useChangePassword, useSendSupport, useDeleteAccount } from './hooks/useSettings';
import { PostCard } from '../../shared/components/PostCard';
import { useAuthStore } from '../../shared/store/useAuthStore';

type Tab = 'saved' | 'password' | 'support' | 'account';

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('saved');

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2 style={{ margin: '0 0 1rem' }}>Settings</h2>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #eee', marginBottom: '1.5rem' }}>
        <TabButton active={tab === 'saved'} onClick={() => setTab('saved')}>Saved posts</TabButton>
        <TabButton active={tab === 'password'} onClick={() => setTab('password')}>Password</TabButton>
        <TabButton active={tab === 'support'} onClick={() => setTab('support')}>Support</TabButton>
        <TabButton active={tab === 'account'} onClick={() => setTab('account')}>Account</TabButton>
      </div>

      {tab === 'saved' && <SavedPostsTab />}
      {tab === 'password' && <PasswordTab />}
      {tab === 'support' && <SupportTab />}
      {tab === 'account' && <AccountTab />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid #646cff' : '2px solid transparent',
        color: active ? '#646cff' : '#555',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SavedPostsTab() {
  const { items, hasMore, loadMore, isLoading, isFetching } = useSavedPosts();

  if (isLoading) return <p style={{ color: '#888' }}>Loading...</p>;
  if (items.length === 0) return <p style={{ color: '#888' }}>You haven't saved any posts yet.</p>;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {items.map((post) => (
          <PostCard key={post.postId} post={post} />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => loadMore()}
          disabled={isFetching}
          style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', background: '#f5f5f5' }}
        >
          {isFetching ? 'Loading...' : 'Load more'}
        </button>
      )}
    </>
  );
}

function PasswordTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [done, setDone] = useState(false);
  const change = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await change.mutateAsync({ currentPassword: current, newPassword: next });
    setCurrent('');
    setNext('');
    setDone(true);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '360px' }}>
      <input
        type="password"
        placeholder="Current password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
      />
      <input
        type="password"
        placeholder="New password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
        minLength={8}
        maxLength={100}
        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
      />
      {change.error && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <p style={{ color: 'red', margin: 0 }}>{(change.error as any).response?.data?.detail || 'Failed to change password'}</p>
      )}
      {done && <p style={{ color: 'green', margin: 0 }}>Password changed.</p>}
      <button type="submit" disabled={change.isPending} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#646cff', color: '#fff', cursor: 'pointer' }}>
        {change.isPending ? 'Saving...' : 'Change password'}
      </button>
    </form>
  );
}

function SupportTab() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const send = useSendSupport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await send.mutateAsync({ subject, message });
    setSubject('');
    setMessage('');
    setDone(true);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '480px' }}>
      <input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        maxLength={200}
        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
      />
      <textarea
        placeholder="Describe your issue"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        maxLength={5000}
        rows={6}
        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
      />
      {done && <p style={{ color: 'green', margin: 0 }}>Message sent.</p>}
      <button type="submit" disabled={send.isPending} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#646cff', color: '#fff', cursor: 'pointer', alignSelf: 'flex-start' }}>
        {send.isPending ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}

function AccountTab() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const deleteAccount = useDeleteAccount();

  const handleDelete = async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    await deleteAccount.mutateAsync();
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '480px' }}>
      <h3 style={{ marginTop: 0, color: '#e74c3c' }}>Danger zone</h3>
      <p style={{ color: '#666' }}>
        Deleting your account is permanent. All your posts, comments, shelves, and chats will be removed.
      </p>
      <button
        onClick={handleDelete}
        disabled={deleteAccount.isPending}
        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer' }}
      >
        {deleteAccount.isPending ? 'Deleting...' : 'Delete account'}
      </button>
    </div>
  );
}
