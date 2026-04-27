import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import client from '../../shared/api/client';

export const VerifyPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const mutation = useMutation({
    mutationFn: (t: string) => client.post(`/auth/verify?token=${t}`),
  });

  useEffect(() => {
    if (token) {
      mutation.mutate(token);
    }
    // mutation is stable from useMutation — including it re-runs on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (mutation.isPending) {
    return <div>Verifying your account...</div>;
  }

  if (mutation.isSuccess) {
    return (
      <div className="auth-container">
        <h1>Email verified!</h1>
        <p>You can now log in to your account.</p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="auth-container">
        <h1 style={{ color: 'red' }}>Verification failed</h1>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <p>{(mutation.error as any).response?.data?.message || 'The token is invalid or has expired.'}</p>
        <Link to="/register">Register again</Link>
      </div>
    );
  }

  return <div>Missing verification token.</div>;
};
