import {useState} from 'react';
import {Link, Navigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '../../shared/store/useAuthStore';
import {type ModerationActionType, type Report, useClaimReport, useReportQueue, useResolveReport} from './hooks/useModeration';

export function ModerationPage() {
  const {t} = useTranslation();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'in_review' | 'resolved'>('pending');
  const [selected, setSelected] = useState<Report | null>(null);

  if (user?.role !== 'moderator' && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const tabs: { key: 'pending' | 'in_review' | 'resolved'; label: string }[] = [
    {key: 'pending', label: t('moderation.statuses.pending')},
    {key: 'in_review', label: t('moderation.statuses.in_review')},
    {key: 'resolved', label: t('moderation.statuses.resolved')},
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="font-serif text-2xl font-bold text-[#1c1714] mb-5">{t('moderation.title')}</h2>

      <div className="flex gap-1 border-b border-[#e8e2d9] mb-6">
        {tabs.map(({key, label}) => (
          <button key={key} onClick={() => { setStatusFilter(key); setSelected(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-none cursor-pointer transition bg-transparent
              ${statusFilter === key ? 'text-[#5b63d3] border-b-2 border-[#5b63d3]' : 'text-[#7a6f68] hover:text-[#2d2926]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <ReportList status={statusFilter} selectedId={selected?.reportId} onSelect={setSelected} />
        {selected && (
          <ReportDetail report={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

function ReportList({ status, selectedId, onSelect }: {
  status: string;
  selectedId: number | undefined;
  onSelect: (r: Report) => void;
}) {
  const {t} = useTranslation();
  const { data: reports, isLoading } = useReportQueue(status);

  if (isLoading) return (
    <div className="flex-1 space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-[#f3ede4] rounded-xl animate-pulse" />)}
    </div>
  );

  if (!reports?.length) return (
    <div className="flex-1 py-16 text-center text-[#b0a9a1]">
      <div className="text-4xl mb-2">✅</div>
      <p className="text-sm">{t('moderation.empty')}</p>
    </div>
  );

  return (
    <div className="flex-1 space-y-2">
      {reports.map((r) => (
        <button key={r.reportId} onClick={() => onSelect(r)}
          className={`w-full text-left p-4 rounded-xl border cursor-pointer transition
            ${selectedId === r.reportId ? 'border-[#5b63d3] bg-[#eef0ff]' : 'border-[#e8e2d9] bg-white hover:border-[#5b63d3]'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
              ${r.targetType === 'post' ? 'bg-blue-100 text-blue-600' :
                r.targetType === 'user' ? 'bg-purple-100 text-purple-600' :
                'bg-orange-100 text-orange-600'}`}>
              {r.targetType}
            </span>
            {r.reporterNickname && (
                <span className="text-xs text-[#7a6f68]">@{r.reporterNickname}</span>
            )}
            <span className="text-xs text-[#7a6f68] ml-auto">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-[#2d2926] line-clamp-2">{r.reason}</p>
        </button>
      ))}
    </div>
  );
}

function TargetLink({report}: { report: Report }) {
  const {t} = useTranslation();
  if (report.targetType === 'user') {
    const nick = report.targetUserNickname;
    if (!nick) return <span className="font-medium text-[#2d2926]">{t('moderation.targetUser')} #{report.targetId}</span>;
    return (
        <Link to={`/u/${nick}`} className="font-medium text-[#5b63d3] hover:underline">
          @{nick}
        </Link>
    );
  }
  if (report.targetType === 'post') {
    return (
        <Link to={`/posts/${report.targetId}`} className="font-medium text-[#5b63d3] hover:underline">
          {t('moderation.targetPost')} #{report.targetId}
          {report.targetPostTitle ? ` — ${report.targetPostTitle}` : ''}
        </Link>
    );
  }
  if (report.targetType === 'comment') {
    const postId = report.targetCommentPostId;
    const preview = report.targetCommentText
        ? `"${report.targetCommentText.slice(0, 60)}${report.targetCommentText.length > 60 ? '…' : ''}"`
        : `#${report.targetId}`;
    if (postId) {
      return (
          <Link to={`/posts/${postId}#comment-${report.targetId}`} className="font-medium text-[#5b63d3] hover:underline">
            {t('moderation.targetComment')} {preview}
          </Link>
      );
    }
    return <span className="font-medium text-[#2d2926]">{t('moderation.targetComment')} {preview}</span>;
  }
  return null;
}

function ReportDetail({ report, onClose }: { report: Report; onClose: () => void }) {
  const {t} = useTranslation();
  const [action, setAction] = useState<ModerationActionType>('reject');
  const [comment, setComment] = useState('');
  const claim = useClaimReport();
  const resolve = useResolveReport();

  const actions: { value: ModerationActionType; label: string; danger?: boolean }[] = [
    {value: 'reject', label: t('moderation.rejectAction')},
    {value: 'warn_user', label: t('moderation.warnUser')},
    {value: 'block_post', label: t('moderation.blockPost')},
    {value: 'ban_user', label: t('moderation.banUser'), danger: true},
  ];

  const handleClaim = () => claim.mutate(report.reportId);
  const handleResolve = async () => {
    await resolve.mutateAsync({ reportId: report.reportId, action, comment });
    onClose();
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-[#e8e2d9] p-5 self-start sticky top-20">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-serif font-bold text-[#1c1714]">{t('moderation.report')} #{report.reportId}</h3>
        <button onClick={onClose} className="text-[#b0a9a1] hover:text-[#7a6f68] bg-transparent border-none cursor-pointer text-lg leading-none">×</button>
      </div>

      <dl className="space-y-2 text-sm mb-4">
        <div className="flex gap-2">
          <dt className="text-[#7a6f68] w-20 flex-shrink-0">{t('moderation.target')}</dt>
          <dd><TargetLink report={report}/></dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[#7a6f68] w-20 flex-shrink-0">{t('moderation.author')}</dt>
          <dd>
            {report.reporterNickname ? (
                <Link to={`/u/${report.reporterNickname}`} className="font-medium text-[#5b63d3] hover:underline">
                  @{report.reporterNickname}
                </Link>
            ) : (
                <span className="text-[#7a6f68] italic">{t('common.anonymous')}</span>
            )}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[#7a6f68] w-20 flex-shrink-0">{t('moderation.status')}</dt>
          <dd className={`font-medium ${
            report.status === 'pending' ? 'text-amber-600' :
            report.status === 'in_review' ? 'text-blue-600' : 'text-green-600'
          }`}>{t(`moderation.statuses.${report.status}`)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[#7a6f68] w-20 flex-shrink-0">{t('moderation.createdAt')}</dt>
          <dd className="text-[#2d2926]">{new Date(report.createdAt).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="bg-[#faf7f2] rounded-lg p-3 text-sm text-[#2d2926] mb-4">
        {report.reason}
      </div>

      {report.status === 'pending' && (
        <button onClick={handleClaim} disabled={claim.isPending}
          className="w-full py-2 rounded-lg border border-[#5b63d3] text-[#5b63d3] text-sm font-medium cursor-pointer hover:bg-[#eef0ff] transition mb-3 bg-white disabled:opacity-50">
          {claim.isPending ? `${t('moderation.claim')}…` : t('moderation.claim')}
        </button>
      )}

      {report.status !== 'resolved' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {actions.map(({value, label, danger}) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="action" value={value} checked={action === value}
                  onChange={() => setAction(value)} className="accent-[#5b63d3]" />
                <span className={`text-sm ${danger ? 'text-red-600' : 'text-[#2d2926]'}`}>{label}</span>
              </label>
            ))}
          </div>
          <textarea
              placeholder={t('moderation.comment')}
            value={comment} onChange={(e) => setComment(e.target.value)}
            rows={2} maxLength={500}
            className="w-full px-3 py-2 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] resize-none"
          />
          <button onClick={handleResolve} disabled={resolve.isPending}
            className={`w-full py-2 rounded-lg text-white text-sm font-semibold border-none cursor-pointer transition disabled:opacity-50
              ${action === 'ban_user' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#5b63d3] hover:bg-[#4951c4]'}`}>
            {resolve.isPending ? `${t('moderation.resolve')}…` : t('moderation.resolve')}
          </button>
        </div>
      )}
    </div>
  );
}
