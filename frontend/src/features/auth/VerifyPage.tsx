import {useEffect, useRef} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import client from '../../shared/api/client';
import {extractApiError} from '../../shared/api/extractApiError';

export const VerifyPage = () => {
  const {t} = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasRun = useRef(false);
  const mutation = useMutation({
    mutationFn: (tok: string) => client.post(`/auth/verify?token=${tok}`),
  });

  useEffect(() => {
    if (token && !hasRun.current) {
      hasRun.current = true;
      mutation.mutate(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const wrap = (icon: string, title: string, body: React.ReactNode) => (
      <div className="flex justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e2dcd5] p-12 text-center">
          <div className="text-5xl mb-4">{icon}</div>
          <h1 className="font-serif text-3xl font-bold text-[#1c1714] mb-3">{title}</h1>
          <div className="text-[#7a6f68] text-base space-y-3">{body}</div>
        </div>
      </div>
  );

  if (mutation.isPending) return wrap('⏳', t('auth.verify.title'), <p>{t('common.loading')}</p>);
  if (mutation.isSuccess) return wrap('✅', t('auth.verify.success'), <><p>{t('auth.login.title')}</p><Link to="/login"
                                                                                                           className="inline-block mt-3 text-[#5b63d3] font-medium hover:underline">{t('auth.verify.goToLogin')} →</Link></>);
  if (mutation.isError) return wrap('❌', t('auth.verify.failure'), <><p>{extractApiError(mutation.error) ?? t('errors.generic')}</p><Link to="/register"
                                                                                                                                          className="inline-block mt-3 text-[#5b63d3] font-medium hover:underline">{t('auth.register.submit')}</Link></>);
  return wrap('🔗', t('errors.notFound'), <p>{t('auth.verify.failure')}</p>);
};
