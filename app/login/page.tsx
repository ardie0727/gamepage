'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, router, loading]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md">
        <AuthForm defaultTab={tab === 'register' ? 'register' : 'login'} />
      </div>
    </div>
  );
}