import {useEffect, useRef, useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {Link, useSearchParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import client from '../../shared/api/client';
import {extractApiError} from '../../shared/api/extractApiError';

export const ResetPasswordPage = () => {
  const {t} = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [matchError, setMatchError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const mutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string }) => client.post('/auth/password/reset', data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setMatchError(t('errors.generic'));
      return;
    }
    setMatchError('');
    mutation.mutate({ token, newPassword });
  };

  if (!token) return (
      <div className="flex justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e2dcd5] p-12 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="font-serif text-3xl font-bold text-[#1c1714] mb-3">{t('errors.notFound')}</h1>
          <p className="text-[#7a6f68] text-base mb-6">{t('errors.generic')}</p>
          <Link to="/forgot-password" className="text-[#5b63d3] font-medium hover:underline text-sm">
            {t('auth.forgot.title')}
          </Link>
        </div>
      </div>
  );

  if (mutation.isSuccess) return (
      <div className="flex justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e2dcd5] p-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="font-serif text-3xl font-bold text-[#1c1714] mb-3">{t('auth.reset.success')}</h1>
          <Link to="/login" className="text-[#5b63d3] font-medium hover:underline text-sm">
            ← {t('auth.verify.goToLogin')}
          </Link>
        </div>
      </div>
  );

  return (
      <div className="flex justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e2dcd5] p-12">
          <h1 className="font-serif text-3xl font-bold text-[#1c1714] text-center mb-8">{t('auth.reset.title')}</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
                ref={inputRef}
                type="password"
                placeholder={t('auth.reset.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 bg-white transition"
            />
            <input
                type="password"
                placeholder={t('auth.reset.confirmPassword')}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 bg-white transition"
            />
            {matchError && <p className="text-red-500 text-sm">{matchError}</p>}
            <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-3 bg-[#5b63d3] hover:bg-[#4951c4] disabled:opacity-50 text-white rounded-lg text-sm font-semibold mt-2 cursor-pointer border-none transition"
            >
              {mutation.isPending ? t('common.saving') : t('auth.reset.submit')}
            </button>
            {mutation.isError && (
                <p className="text-red-500 text-sm">
                  {extractApiError(mutation.error) ?? t('errors.generic')}
                </p>
            )}
          </form>
        </div>
      </div>
  );
};
