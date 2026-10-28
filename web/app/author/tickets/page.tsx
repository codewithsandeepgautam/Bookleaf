'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/Badges';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/usePolling';
import { fmtDateTime } from '@/lib/utils';
import type { Ticket } from '@/lib/types';

export default function MyTickets() {
  const { data, loading, error } = usePolling(() => api<{ data: Ticket[] }>('/tickets?limit=100'), [], 4000);
  const tickets = data?.data || [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">My Tickets</h1><p className="text-sm text-muted-foreground">Updates appear here automatically.</p></div>
        <Button asChild><Link href="/author/tickets/new">New query</Link></Button>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && tickets.length === 0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">You have not raised any queries yet. Questions about royalties, ISBNs, printing or your book&apos;s status? <Link className="underline" href="/author/tickets/new">Raise one</Link>.</CardContent></Card>}
      {tickets.map((t) => (
        <Link key={t.id} href={`/author/tickets/${t.id}`} className="block">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{t.ticketNumber} · {t.book?.title || 'General / Account Level'}</div>
                <div className="truncate font-medium">{t.subject}</div>
                <div className="text-xs text-muted-foreground">Last update {fmtDateTime(t.lastActivityAt)} · {t.responseCount} repl{t.responseCount === 1 ? 'y' : 'ies'} from BookLeaf</div>
              </div>
              <StatusBadge status={t.status} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
