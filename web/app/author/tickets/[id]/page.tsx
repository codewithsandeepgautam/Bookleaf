'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/Badges';
import { Thread } from '@/components/Thread';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/usePolling';
import type { Ticket } from '@/lib/types';

export default function AuthorTicket() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = usePolling(() => api<{ data: Ticket }>(`/tickets/${id}`), [id], 3000);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const t = data?.data;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await api(`/tickets/${id}/messages`, { method: 'POST', body: { body: reply } }); setReply(''); await reload(); }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error || !t) return <p className="text-sm text-destructive">{error || 'Ticket not found.'}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/author/tickets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"><ArrowLeft className="h-4 w-4" />All tickets</Link>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><div className="text-xs text-muted-foreground">{t.ticketNumber} · {t.book?.title || 'General / Account Level'} · {t.category}</div><h1 className="text-xl font-semibold">{t.subject}</h1></div>
        <StatusBadge status={t.status} />
      </div>
      <Thread viewer="author" original={t.description} authorName="You" createdAt={t.createdAt} messages={t.messages || []} />
      {t.attachments.length > 0 && <p className="text-xs text-muted-foreground">Attached: {t.attachments.map((a) => a.name).join(', ')}</p>}
      {(t.messages || []).filter((m) => m.sender === 'admin').length === 0 && <Card><CardContent className="p-4 text-sm text-muted-foreground">Thanks for writing in. Our team will reply within 48 hours; this page updates automatically.</CardContent></Card>}
      {t.status === 'Closed' ? (
        <p className="text-sm text-muted-foreground">This ticket is closed. <Link className="underline" href="/author/tickets/new">Raise a new query</Link> if you need more help.</p>
      ) : (
        <form onSubmit={send} className="space-y-2">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a reply…" maxLength={5000} />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button disabled={busy || !reply.trim()}>{busy ? 'Sending…' : 'Send reply'}</Button>
        </form>
      )}
    </div>
  );
}
