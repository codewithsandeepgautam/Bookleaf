'use client';
import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PriorityBadge, SourceTag, StatusBadge } from '@/components/Badges';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/usePolling';
import { ageHours, ageLabel, cn } from '@/lib/utils';
import type { Ticket } from '@/lib/types';

const CATEGORIES = ['Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function Queue() {
  const [f, setF] = useState({ status: '', category: '', priority: '', assigned: '', from: '', to: '', q: '', sort: 'urgency' });
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);
  qs.set('limit', '100');

  const { data, loading, error } = usePolling(() => api<{ data: Ticket[]; meta: { total: number } }>(`/tickets?${qs}`), [qs.toString()], 5000);
  const stats = usePolling(() => api<{ data: any }>('/tickets/stats'), [], 10000).data?.data;
  const tickets = data?.data || [];

  const Stat = ({ label, value, warn }: { label: string; value: number; warn?: boolean }) => (
    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">{label}</div><div className={cn('text-2xl font-semibold', warn && value > 0 && 'text-red-600')}>{value}</div></CardContent></Card>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ticket Queue</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Open" value={stats?.byStatus?.Open || 0} />
        <Stat label="In progress" value={stats?.byStatus?.['In Progress'] || 0} />
        <Stat label="Critical + High (active)" value={(stats?.activeByPriority?.Critical || 0) + (stats?.activeByPriority?.High || 0)} warn />
        <Stat label="Unanswered > 48h" value={stats?.overdue48h || 0} warn />
        <Stat label="Unassigned" value={stats?.unassigned || 0} />
      </div>

      <Card><CardContent className="grid gap-2 p-4 md:grid-cols-4 lg:grid-cols-8">
        <Input placeholder="Search…" value={f.q} onChange={set('q')} className="lg:col-span-2" />
        <Select value={f.status} onChange={set('status')} aria-label="Status"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={f.category} onChange={set('category')} aria-label="Category"><option value="">All categories</option>{CATEGORIES.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={f.priority} onChange={set('priority')} aria-label="Priority"><option value="">All priorities</option>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={f.assigned} onChange={set('assigned')} aria-label="Assignee"><option value="">Anyone</option><option value="me">Assigned to me</option><option value="unassigned">Unassigned</option></Select>
        <Input type="date" value={f.from} onChange={set('from')} aria-label="From date" />
        <Input type="date" value={f.to} onChange={set('to')} aria-label="To date" />
        <Select value={f.sort} onChange={set('sort')} aria-label="Sort"><option value="urgency">Most urgent first</option><option value="oldest">Oldest first</option><option value="newest">Newest first</option></Select>
      </CardContent></Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Ticket</th><th>Author / Book</th><th>Category</th><th>Priority</th><th>Status</th><th>Assignee</th><th className="pr-3 text-right">Age</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {!loading && tickets.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No tickets match these filters.</td></tr>}
            {tickets.map((t) => {
              const active = t.status === 'Open' || t.status === 'In Progress';
              const stale = active && ageHours(t.createdAt) > 48;
              const hot = active && (t.priority === 'Critical' || t.priority === 'High');
              return (
                <tr key={t.id} className={cn('border-b last:border-0 hover:bg-accent/40', hot && 'border-l-4 border-l-red-400', !active && 'opacity-60')}>
                  <td className="max-w-[260px] p-3"><Link href={`/admin/tickets/${t.id}`} className="block"><div className="text-xs text-muted-foreground">{t.ticketNumber}</div><div className="truncate font-medium hover:underline">{t.subject}</div></Link></td>
                  <td><div>{t.author?.name}</div><div className="text-xs text-muted-foreground">{t.book?.title || 'General / Account'}</div></td>
                  <td><div>{t.category}</div><SourceTag source={t.categorySource} /></td>
                  <td><PriorityBadge priority={t.priority} /> <SourceTag source={t.prioritySource} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-muted-foreground">{t.assignedTo?.name || '—'}</td>
                  <td className={cn('pr-3 text-right', stale && 'font-semibold text-red-600')}>{stale && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}{ageLabel(t.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted-foreground">Auto-refreshes every 5 seconds. Red edge = active Critical/High. Red age = unresolved for over 48 hours.</p>
    </div>
  );
}
