import {useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import client from '../../shared/api/client';
import {extractApiError} from '../../shared/api/extractApiError';

export const RegisterPage = () => {
  const {t} = useTranslation();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: { nickname: string; email: string; password: string }) =>
        client.post('/auth/register', data),
    onSuccess: () => setSuccess(true),
  });

  if (success) {
    return (
        <div className="flex justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e2dcd5] p-12 text-center">
            <div className="text-5xl mb-5">✉️</div>
            <h1 className="font-serif text-3xl font-bold text-[#1c1714] mb-3">{t('auth.verify.title')}</h1>
            <p className="text-[#7a6f68] text-base mb-6">
              {t('auth.verify.checkEmail')} <strong>{email}</strong>.
            </p>
            <Link to="/login" className="text-[#5b63d3] font-medium hover:underline text-sm">
              {t('auth.verify.goToLogin')} →
            </Link>
          </div>
        </div>
    );
  }

  return (
      <div className="flex justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e2dcd5] p-12">
          <h1 className="font-serif text-2xl font-bold text-[#1c1714] text-center mb-3">{t('auth.register.title')}</h1>
          <p className="text-center text-[#7a6f68] text-base mb-8">{t('brand.tagline')}</p>
          <form
              onSubmit={(e) => { e.preventDefault(); mutation.mutate({ nickname, email, password }); }}
              className="flex flex-col gap-4"
          >
            <input
                type="text" placeholder={t('auth.register.nickname')} value={nickname}
                onChange={(e) => setNickname(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 bg-white transition"
            />
            <input
                type="email" placeholder={t('auth.register.email')} value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 bg-white transition"
            />
            <input
                type="password" placeholder={t('auth.register.password')} value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 bg-white transition"
            />
            <button
                type="submit" disabled={mutation.isPending}
                className="w-full py-3 bg-[#5b63d3] hover:bg-[#4951c4] disabled:opacity-50 text-white rounded-lg text-sm font-semibold mt-2 cursor-pointer border-none transition"
            >
              {mutation.isPending ? `${t('auth.register.submit')}…` : t('auth.register.submit')}
            </button>
            {mutation.isError && (
                <p className="text-red-500 text-sm text-center">
                  {extractApiError(mutation.error) ?? t('errors.generic')}
                </p>
            )}
          </form>
          <p className="mt-8 text-center text-[#7a6f68] text-sm">
            {t('auth.register.haveAccount')} <Link to="/login" className="text-[#5b63d3] font-medium hover:underline">{t('auth.register.login')}</Link>
          </p>
        </div>
      </div>
  );
};