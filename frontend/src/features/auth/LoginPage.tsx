import {useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {Link, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import client from '../../shared/api/client';
import {useAuthStore} from '../../shared/store/useAuthStore';
import {extractApiError} from '../../shared/api/extractApiError';

export const LoginPage = () => {
  const {t} = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => client.post('/auth/login', data),
    onSuccess: (response) => {
      const { accessToken, user } = response.data;
      setAuth(user, accessToken);
      navigate('/');
    },
  });

  return (
      <div className="flex justify-center px-4"> {/* убрал min-h и центрирование, т.к. main уже центрирует */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e2dcd5] p-12">
          <h1 className="font-serif text-3xl font-bold text-[#1c1714] text-center mb-3">{t('auth.login.title')}</h1>
          <p className="text-base text-[#7a6f68] text-center mb-8">{t('auth.login.submit')}</p>
          <form
              onSubmit={(e) => { e.preventDefault(); mutation.mutate({ email, password }); }}
              className="flex flex-col gap-4"
          >
            <input
                type="email" placeholder={t('auth.login.email')} value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 bg-white transition"
            />
            <input
                type="password" placeholder={t('auth.login.password')} value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 bg-white transition"
            />
            <button
                type="submit" disabled={mutation.isPending}
                className="w-full py-3 bg-[#5b63d3] hover:bg-[#4951c4] disabled:opacity-50 text-white rounded-lg text-sm font-semibold mt-2 cursor-pointer border-none transition"
            >
              {mutation.isPending ? `${t('auth.login.submit')}…` : t('auth.login.submit')}
            </button>
            {mutation.isError && (
                <p className="text-red-500 text-sm text-center">
                  {extractApiError(mutation.error) ?? t('auth.login.errorInvalid')}
                </p>
            )}
          </form>
          <div className="mt-8 text-center text-sm space-y-1.5">
            <div><Link to="/forgot-password" className="text-[#7a6f68] hover:text-[#5b63d3] transition-colors text-xs">{t('auth.login.forgot')}</Link></div>
            <div className="text-[#7a6f68]">{t('auth.login.noAccount')} <Link to="/register" className="text-[#5b63d3] font-medium hover:underline">{t('auth.login.register')}</Link></div>
          </div>
        </div>
      </div>
  );
};