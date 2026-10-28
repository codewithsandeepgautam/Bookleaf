'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriorityBadge, SourceTag, StatusBadge } from '@/components/Badges';
import { Thread } from '@/components/Thread';
import { api } from '@/lib/api';
import { usePolling } from '@/lib/usePolling';
import { fmtDateTime } from '@/lib/utils';
import type { Draft, Ticket } from '@/lib/types';

const CATEGORIES = ['Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function AdminTicket() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = usePolling(() => api<{ data: Ticket }>(`/tickets/${id}`), [id], 3000);
  const t = data?.data;

  const [reply, setReply] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [touched, setTouched] = useState(false); // admin typed -> never overwrite their text
  const [after, setAfter] = useState('In Progress');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const started = useRef<string | null>(null);

  async function generate(force = false) {
    setDrafting(true); setMsg('');
    try {
      const r = await api<{ data: Draft }>(`/tickets/${id}/draft`, { method: 'POST' });
      setDraft(r.data);
      if (force || !touched) { setReply(r.data.text); setTouched(false); }
    } catch (e: any) { setMsg(`Could not generate a draft: ${e.message}. You can write the reply manually.`); }
    finally { setDrafting(false); }
  }

  // On open: reuse the cached draft if one exists (saves tokens), otherwise generate once.
  useEffect(() => {
    if (!t || started.current === t.id) return;
    started.current = t.id;
    if (t.aiDraft?.text) { setDraft(t.aiDraft); setReply(t.aiDraft.text); }
    else generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.id]);

  async function act(fn: () => Promise<any>, ok?: string) {
    setBusy(true); setMsg('');
    try { await fn(); await reload(); if (ok) setMsg(ok); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }
  const patch = (body: object) => act(() => api(`/tickets/${id}`, { method: 'PATCH', body }));
  const send = () => act(async () => {
    await api(`/tickets/${id}/messages`, { method: 'POST', body: { body: reply, status: after } });
    setReply(''); setTouched(false); setDraft(null);
  }, 'Reply sent. The author can see it now.');

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error || !t) return <p className="text-sm text-destructive">{error || 'Ticket not found.'}</p>;

  return (
    <div className="space-y-4">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"><ArrowLeft className="h-4 w-4" />Queue</Link>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs text-muted-foreground">{t.ticketNumber} · {t.author?.name} ({t.author?.authorId}) · {t.book?.title || 'General / Account Level'} · opened {fmtDateTime(t.createdAt)}</div>
          <h1 className="text-xl font-semibold">{t.subject}</h1>
        </div>
        <div className="flex items-center gap-2"><PriorityBadge priority={t.priority} /><StatusBadge status={t.status} /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Thread viewer="admin" original={t.description} authorName={t.author?.name || 'Author'} createdAt={t.createdAt} messages={t.messages || []} />
          {t.attachments.length > 0 && <p className="text-xs text-muted-foreground">Attachments (names only): {t.attachments.map((a) => a.name).join(', ')}</p>}

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-purple-600" />Reply to author</CardTitle>
                <Button variant="outline" size="sm" disabled={drafting} onClick={() => generate(true)}><RefreshCw className={`h-3.5 w-3.5 ${drafting ? 'animate-spin' : ''}`} />{drafting ? 'Drafting…' : 'Regenerate AI draft'}</Button>
              </div>
              {draft && !drafting && (
                <p className={`text-xs ${draft.warning ? 'text-amber-700' : 'text-muted-foreground'}`}>
                  {draft.warning || `AI draft (${draft.model}) based on this ticket, the author's real book data and the BookLeaf knowledge base. Review and edit before sending.`}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea rows={10} value={reply} onChange={(e) => { setReply(e.target.value); setTouched(true); }} placeholder={drafting ? 'Generating a draft…' : 'Write your reply…'} maxLength={5000} />
              <div className="flex flex-wrap items-center gap-3">
                <Label htmlFor="after" className="text-xs">After sending, set status to</Label>
                <Select id="after" className="w-40" value={after} onChange={(e) => setAfter(e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
                <Button disabled={busy || !reply.trim()} onClick={send}>Send reply</Button>
              </div>
              {msg && <p className="text-sm text-muted-foreground" role="status">{msg}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Ticket management</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select value={t.status} disabled={busy} onChange={(e) => patch({ status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></div>
              <div className="space-y-1"><div className="flex justify-between"><Label className="text-xs">Category</Label><SourceTag source={t.categorySource} /></div>
                <Select value={t.category} disabled={busy} onChange={(e) => patch({ category: e.target.value }).then(() => { setDraft(null); generate(true); })}>{CATEGORIES.map((s) => <option key={s}>{s}</option>)}</Select></div>
              <div className="space-y-1"><div className="flex justify-between"><Label className="text-xs">Priority</Label><SourceTag source={t.prioritySource} /></div>
                <Select value={t.priority} disabled={busy} onChange={(e) => patch({ priority: e.target.value })}>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</Select></div>
              {t.aiReasoning && <p className="text-xs text-muted-foreground">AI note: {t.aiReasoning}</p>}
              <div className="flex items-center justify-between gap-2 border-t pt-3 text-sm">
                <span className="text-muted-foreground">Assignee: <span className="text-foreground">{t.assignedTo?.name || 'Unassigned'}</span></span>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => patch({ assignedTo: 'me' })}><UserCheck className="h-4 w-4" />Assign to me</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Internal notes <span className="text-xs font-normal text-muted-foreground">(hidden from author)</span></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(t.internalNotes || []).length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
              {(t.internalNotes || []).map((n) => (
                <div key={n.id} className="rounded-md bg-yellow-50 p-2 text-sm"><div className="text-xs text-muted-foreground">{n.authorName} · {fmtDateTime(n.createdAt)}</div><p className="whitespace-pre-wrap">{n.body}</p></div>
              ))}
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" maxLength={3000} />
              <Button size="sm" variant="secondary" disabled={busy || !note.trim()} onClick={() => act(async () => { await api(`/tickets/${id}/notes`, { method: 'POST', body: { body: note } }); setNote(''); })}>Add note</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
