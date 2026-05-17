import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {type SupportMessage, useReplySupport, useSupportQueue} from './hooks/useSupport';

export function SupportPage() {
  const {t} = useTranslation();
  const {data, isLoading} = useSupportQueue();
  const [selected, setSelected] = useState<SupportMessage | null>(null);

  if (isLoading) {
    return <div className="p-8 text-[#7a6f68]">{t('common.loading')}</div>;
  }
  const tickets = data ?? [];

  return (
      <div className="max-w-6xl mx-auto p-6 flex gap-5">
        <aside className="w-80 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-[#e8e2d9] overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-[#e8e2d9]">
            <h2 className="font-serif text-xl font-bold text-[#2d2926]">{t('admin.support.title')}</h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {tickets.length === 0 && (
                <div className="p-6 text-sm text-[#7a6f68]">{t('admin.support.empty')}</div>
            )}
            {tickets.map((m) => (
                <button
                    key={m.supportMessageId}
                    onClick={() => setSelected(m)}
                    className={`w-full text-left p-4 border-b border-[#f4f1ec] hover:bg-[#faf8f5] transition-colors ${
                        selected?.supportMessageId === m.supportMessageId ? 'bg-[#eef0ff]' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#2d2926]">@{m.userNickname}</span>
                    <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            m.status === 'resolved'
                                ? 'bg-[#e8f5ed] text-[#2c9b5d]'
                                : 'bg-[#fdf1e8] text-[#c4753b]'
                        }`}
                    >
                  {m.status === 'resolved' ? t('admin.support.status.resolved') : t('admin.support.status.open')}
                </span>
                  </div>
                  <div className="text-sm text-[#2d2926] mt-1 truncate font-medium">{m.subject}</div>
                  <div className="text-xs text-[#7a6f68] mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 bg-white rounded-2xl shadow-sm border border-[#e8e2d9] p-6">
          {selected ? <SupportDetail ticket={selected}/> : (
              <div className="text-[#7a6f68] text-sm">{t('admin.support.selectTicket')}</div>
          )}
        </main>
      </div>
  );
}

function SupportDetail({ticket}: { ticket: SupportMessage }) {
  const {t} = useTranslation();
  const reply = useReplySupport();
  const [text, setText] = useState(ticket.response ?? '');
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    await reply.mutateAsync({id: ticket.supportMessageId, response: text.trim()});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
      <div className="space-y-5">
        <div>
          <div className="text-xs uppercase text-[#7a6f68] font-semibold">{t('admin.support.from')}</div>
          <Link to={`/u/${ticket.userNickname}`} className="text-[#5b63d3] hover:underline font-semibold">
            @{ticket.userNickname}
          </Link>
        </div>

        <div>
          <div className="text-xs uppercase text-[#7a6f68] font-semibold mb-1">{t('admin.support.subject')}</div>
          <div className="text-lg font-semibold text-[#2d2926]">{ticket.subject}</div>
        </div>

        <div>
          <div className="text-xs uppercase text-[#7a6f68] font-semibold mb-1">{t('admin.support.message')}</div>
          <p className="whitespace-pre-wrap text-[#2d2926] bg-[#faf8f5] p-4 rounded-lg">{ticket.message}</p>
        </div>

        <div>
          <label className="text-xs uppercase text-[#7a6f68] font-semibold block mb-2">
            {t('admin.support.yourReply')}
          </label>
          <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-[#e8e2d9] rounded-lg focus:outline-none focus:border-[#5b63d3]"
          />
          <button
              onClick={submit}
              disabled={reply.isPending || !text.trim()}
              className="mt-3 px-5 py-2 bg-[#5b63d3] text-white rounded-lg hover:bg-[#4951c4] disabled:opacity-50 font-medium"
          >
            {reply.isPending ? t('common.sending') : t('admin.support.send')}
          </button>
          {success && <p className="text-[#2c9b5d] text-sm mt-2">{t('admin.support.replySent')}</p>}
        </div>
      </div>
  );
}
