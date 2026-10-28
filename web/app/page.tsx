'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(!user ? '/login' : user.role === 'admin' ? '/admin' : '/author/books');
  }, [user, loading, router]);
  return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
}
