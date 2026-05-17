import {useEffect, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useSearch} from './hooks/useSearch';
import {PostCard} from '../../shared/components/PostCard';
import {ReportModal} from '../moderation/ReportModal';

export function SearchPage() {
  const {t} = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [input, setInput] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [reportPostId, setReportPostId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(input);
      if (input.trim()) setSearchParams({ q: input.trim() }, { replace: true });
      else setSearchParams({}, { replace: true });
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, setSearchParams]);

  const { data, isLoading } = useSearch(debouncedQ);
  const hasResults = data && (data.users.length > 0 || data.posts.length > 0 || data.tags.length > 0);

  return (
    <div className="px-8 py-6">
      <h2 className="font-serif text-2xl font-bold text-[#1c1714] mb-4">{t('common.search')}</h2>

      <div className="relative mb-6">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a6f68]">🔍</span>
        <input
          autoFocus value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition"
        />
      </div>

      {isLoading && debouncedQ && <p className="text-[#7a6f68] text-sm">{t('common.loading')}</p>}
      {debouncedQ && !isLoading && !hasResults && (
          <p className="text-[#7a6f68] text-sm text-center py-8">{t('search.noResults')}</p>
      )}

      {data && (
        <div className="space-y-8">
          {data.users.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-[#7a6f68] uppercase tracking-wider mb-3">{t('search.tabs.users')}</h3>
              <div className="space-y-2">
                {data.users.map((u) => (
                  <Link key={u.userId} to={`/u/${u.nickname}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#e8e2d9] no-underline hover:border-[#5b63d3] hover:shadow-sm transition">
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-[#e8e2d9] flex-shrink-0" />}
                    <div>
                      <div className="text-sm font-semibold text-[#2d2926]">@{u.nickname}</div>
                      {u.isPrivate && <div className="text-xs text-[#7a6f68]">{t('profile.private')}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.tags.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-[#7a6f68] uppercase tracking-wider mb-3">{t('search.tabs.tags')}</h3>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <Link key={tag.tagId} to={`/tags/${tag.name}`}
                    className="text-sm bg-[#eef0ff] text-[#5b63d3] px-3 py-1 rounded-full no-underline hover:bg-[#5b63d3] hover:text-white transition font-medium">
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.posts.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-[#7a6f68] uppercase tracking-wider mb-3">{t('search.tabs.posts')}</h3>
              <div className="space-y-4">
                {data.posts.map((post) => (
                  <PostCard key={post.postId} post={post} onReport={(id) => setReportPostId(id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {reportPostId !== null && <ReportModal targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />}
    </div>
  );
}
