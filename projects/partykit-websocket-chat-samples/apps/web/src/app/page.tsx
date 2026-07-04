'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) router.replace(user ? '/rooms' : '/login');
  }, [user, loading, router]);
  return (
    <div className="loading-center" style={{ height: '100vh' }}>
      <div className="spinner" />
    </div>
  );
}
