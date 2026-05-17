import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useChangePassword, useDeleteAccount, useSavedPosts, useSendSupport} from './hooks/useSettings';
import {useMySupport} from './hooks/useMySupport';
import {PostCard} from '../../shared/components/PostCard';
import {useAuthStore} from '../../shared/store/useAuthStore';
import {extractApiError} from '../../shared/api/extractApiError';

type Tab = 'saved' | 'password' | 'support' | 'account';

export function SettingsPage() {
  const {t} = useTranslation();
  const [tab, setTab] = useState<Tab>('saved');

  const tabs: { key: Tab; label: string }[] = [
    {key: 'saved', label: t('settings.tabs.saved')},
    {key: 'password', label: t('settings.changePassword')},
    {key: 'support', label: t('settings.tabs.support')},
    {key: 'account', label: t('settings.tabs.account')},
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="font-serif text-2xl font-bold text-[#1c1714] mb-5">{t('settings.title')}</h2>

      <div className="flex gap-1 border-b border-[#e8e2d9] mb-6">
        {tabs.map(({key, label}) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-none cursor-pointer transition bg-transparent
              ${tab === key ? 'text-[#5b63d3] border-b-2 border-[#5b63d3]' : 'text-[#7a6f68] hover:text-[#2d2926]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'saved' && <SavedPostsTab />}
      {tab === 'password' && <PasswordTab />}
      {tab === 'support' && <SupportTab />}
      {tab === 'account' && <AccountTab />}
    </div>
  );
}

function SavedPostsTab() {
  const {t} = useTranslation();
  const { items, hasMore, loadMore, isLoading, isFetching } = useSavedPosts();
  if (isLoading) return <p className="text-[#7a6f68] text-sm">{t('common.loading')}</p>;
  if (items.length === 0) return (
    <div className="text-center py-12 text-[#7a6f68]">
      <div className="text-4xl mb-3">🔖</div>
      <p className="text-sm">{t('settings.tabs.saved')}</p>
    </div>
  );
  return (
    <>
      <div className="space-y-4">{items.map((post) => <PostCard key={post.postId} post={post} />)}</div>
      {hasMore && (
        <button onClick={() => loadMore()} disabled={isFetching}
          className="mt-5 w-full py-2.5 rounded-xl border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] hover:border-[#5b63d3] cursor-pointer transition disabled:opacity-50">
          {isFetching ? t('common.loading') : t('common.loadMore')}
        </button>
      )}
    </>
  );
}

function PasswordTab() {
  const {t} = useTranslation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [done, setDone] = useState(false);
  const change = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await change.mutateAsync({ currentPassword: current, newPassword: next });
    setCurrent(''); setNext(''); setDone(true);
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <input type="password" placeholder={t('settings.currentPassword')} value={current} onChange={(e) => setCurrent(e.target.value)} required className={inputCls}/>
      <input type="password" placeholder={t('settings.newPassword')} value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} maxLength={100} className={inputCls}/>
      {change.error && <p className="text-red-500 text-sm">{extractApiError(change.error) ?? t('errors.generic')}</p>}
      {done && <p className="text-green-600 text-sm">{t('settings.passwordChanged')}</p>}
      <button type="submit" disabled={change.isPending}
        className="px-5 py-2.5 bg-[#5b63d3] hover:bg-[#4951c4] text-white rounded-lg text-sm font-semibold border-none cursor-pointer transition disabled:opacity-50 self-start mt-1">
        {change.isPending ? t('common.saving') : t('settings.changePassword')}
      </button>
    </form>
  );
}

function SupportTab() {
  const {t} = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const send = useSendSupport();
  const {data: history} = useMySupport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await send.mutateAsync({ subject, message });
    setSubject(''); setMessage(''); setDone(true);
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition';

  return (
      <div className="space-y-8 max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <h3 className="font-serif text-lg font-bold text-[#2d2926]">{t('settings.support.title')}</h3>
          <input placeholder={t('settings.support.subject')} value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} className={inputCls}/>
          <textarea placeholder={t('settings.support.message')} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={5000} rows={6} className={inputCls + ' resize-y'}/>
          {done && <p className="text-green-600 text-sm">{t('settings.support.sent')}</p>}
          <button type="submit" disabled={send.isPending}
                  className="px-5 py-2.5 bg-[#5b63d3] hover:bg-[#4951c4] text-white rounded-lg text-sm font-semibold border-none cursor-pointer transition disabled:opacity-50 self-start">
            {send.isPending ? t('common.sending') : t('settings.support.send')}
          </button>
        </form>

        <div>
          <h3 className="font-serif text-lg font-bold text-[#2d2926] mb-3">{t('settings.support.history')}</h3>
          {!history || history.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">{t('settings.support.noHistory')}</p>
          ) : (
              <ul className="space-y-3">
                {history.map((m) => (
                    <li key={m.supportMessageId} className="border border-[#e8e2d9] rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm text-[#1c1714]">{m.subject}</div>
                        <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                m.status === 'resolved'
                                    ? 'bg-[#e8f5ed] text-[#2c9b5d]'
                                    : 'bg-[#fdf1e8] text-[#c4753b]'
                            }`}
                        >
                    {m.status === 'resolved' ? t('settings.support.status.resolved') : t('settings.support.status.open')}
                  </span>
                      </div>
                      <p className="text-sm text-[#2d2926] whitespace-pre-wrap">{m.message}</p>
                      <div className="text-xs text-[#7a6f68] mt-2">{new Date(m.createdAt).toLocaleString()}</div>
                      {m.response ? (
                          <div className="mt-3 bg-[#eef0ff] rounded-lg p-3">
                            <div className="text-xs uppercase font-semibold text-[#5b63d3] mb-1">{t('settings.support.adminReply')}</div>
                            <p className="text-sm text-[#2d2926] whitespace-pre-wrap">{m.response}</p>
                          </div>
                      ) : (
                          <p className="text-xs italic text-[#7a6f68] mt-2">{t('settings.support.noReply')}</p>
                      )}
                    </li>
                ))}
              </ul>
          )}
        </div>
      </div>
  );
}

function AccountTab() {
  const {t} = useTranslation();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const deleteAccount = useDeleteAccount();

  const handleDelete = async () => {
    if (!confirm(t('settings.deleteAccountConfirm'))) return;
    await deleteAccount.mutateAsync();
    logout(); navigate('/login');
  };

  return (
    <div className="max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <h3 className="font-serif font-bold text-red-700 mb-2">{t('settings.tabs.danger')}</h3>
        <p className="text-sm text-red-600 mb-4">{t('settings.deleteAccountConfirm')}</p>
        <button onClick={handleDelete} disabled={deleteAccount.isPending}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold border-none cursor-pointer transition disabled:opacity-50">
          {deleteAccount.isPending ? t('common.deleting') : t('settings.deleteAccount')}
        </button>
      </div>
    </div>
  );
}
