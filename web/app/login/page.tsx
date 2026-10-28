'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

const DEMO = [
  { label: 'Author (Priya Sharma)', email: 'priya.sharma@email.com', password: 'Author@123' },
  { label: 'Author with no payouts (Ananya Reddy)', email: 'ananya.reddy@email.com', password: 'Author@123' },
  { label: 'Author with a book in production (Sneha Kulkarni)', email: 'sneha.kulkarni@email.com', password: 'Author@123' },
  { label: 'Admin', email: 'admin@bookleaf.com', password: 'Admin@123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const u = await login(email, password);
      router.replace(u.role === 'admin' ? '/admin' : '/author/books');
    } catch (err: any) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <Card>
        <CardHeader>
          <CardTitle>BookLeaf Support Portal</CardTitle>
          <CardDescription>Sign in with your registered email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Demo accounts (click to fill)</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {DEMO.map((d) => (
            <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword(d.password); }} className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent">
              {d.label} <span className="text-muted-foreground">· {d.email}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
