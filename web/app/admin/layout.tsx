'use client';
import { Shell } from '@/components/Shell';
import { useRequireRole } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useRequireRole('admin');
  if (!user) return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  return <Shell role="admin">{children}</Shell>;
}
