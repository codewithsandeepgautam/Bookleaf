'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/usePolling';
import { fmtDate, inr } from '@/lib/utils';
import type { Book } from '@/lib/types';

const Stat = ({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) => (
  <div><div className="text-xs text-muted-foreground">{label}</div><div className={`font-semibold ${tone || ''}`}>{value}</div></div>
);

export default function BooksPage() {
  const { data, loading, error } = usePolling(() => api<{ data: Book[] }>('/books'), [], 30000);
  const books = data?.data || [];

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold">My Books</h1><p className="text-sm text-muted-foreground">Sales and royalty figures for your titles.</p></div>
      {loading && <p className="text-sm text-muted-foreground">Loading your books…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && books.length === 0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">No books on your account yet.</CardContent></Card>}
      <div className="grid gap-4 md:grid-cols-2">
        {books.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{b.title}</CardTitle>
                <Badge variant={b.inProduction ? 'yellow' : 'green'}>{b.status}</Badge>
              </div>
              <CardDescription>{b.genre} · ISBN {b.isbn}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Stat label="Published" value={fmtDate(b.publicationDate)} />
                <Stat label="MRP" value={inr(b.mrp)} />
                <Stat label="Copies sold" value={b.totalCopiesSold.toLocaleString('en-IN')} />
                <Stat label="Royalty earned" value={inr(b.totalRoyaltyEarned)} />
                <Stat label="Royalty paid" value={inr(b.royaltyPaid)} tone="text-green-700" />
                <Stat label="Royalty pending" value={inr(b.royaltyPending)} tone={b.royaltyPending > 0 ? 'text-orange-700' : ''} />
              </div>
              {b.inProduction ? (
                <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">This book is still in production, so there are no sales or royalties yet. We email you at every stage.</p>
              ) : b.royaltyPaid === 0 && b.royaltyPending > 0 ? (
                <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">No payout yet. Royalties are paid quarterly within 45 days of quarter end{b.royaltyPending < 1000 ? '; balances under ₹1,000 roll over to the next quarter' : ''}.</p>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{b.availableOn.length ? `Live on: ${b.availableOn.join(', ')}` : 'Not live on any platform yet'}{b.lastRoyaltyPayoutDate ? ` · Last payout ${fmtDate(b.lastRoyaltyPayoutDate)}` : ''}</span>
                <Button asChild variant="outline" size="sm"><Link href={`/author/tickets/new?book=${b.bookId}`}>Raise a query</Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
