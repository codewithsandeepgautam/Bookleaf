'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { usePolling } from '@/lib/usePolling';
import type { Book } from '@/lib/types';

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const { data } = usePolling(() => api<{ data: Book[] }>('/books'), [], 60000);
  const [bookId, setBookId] = useState(params.get('book') || '');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setFieldErrors({});
    try {
      // Attachments are UI-only (assignment: actual upload is a bonus) - only file metadata is stored.
      const attachments = files.map((f) => ({ name: f.name, size: f.size }));
      const r = await api<{ data: { id: string } }>('/tickets', { method: 'POST', body: { bookId: bookId || null, subject, description, attachments } });
      router.push(`/author/tickets/${r.data.id}`);
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.message);
      if (e2.details) setFieldErrors(Object.fromEntries(e2.details.map((d) => [d.field, d.message])));
    } finally { setBusy(false); }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader><CardTitle>Submit a support query</CardTitle><CardDescription>We reply within 48 hours. You can follow the conversation under My Tickets.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="book">Which book is this about?</Label>
            <Select id="book" value={bookId} onChange={(e) => setBookId(e.target.value)}>
              <option value="">General / Account Level</option>
              {data?.data.map((b) => <option key={b.bookId} value={b.bookId}>{b.title}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required placeholder="e.g. Royalty for Q2 not received" />
            {fieldErrors.subject && <p className="text-xs text-destructive">{fieldErrors.subject}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Describe the issue</Label>
            <Textarea id="desc" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} required placeholder="Include dates, amounts, platform names or anything that helps us check faster." />
            {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="files">Attachments (optional)</Label>
            <label htmlFor="files" className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-accent">
              <Paperclip className="h-4 w-4" />{files.length ? files.map((f) => f.name).join(', ') : 'Add photos or documents (max 5)'}
            </label>
            <input id="files" type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))} />
            <p className="text-xs text-muted-foreground">File names are recorded with your ticket. Upload storage is coming soon; for photos of defective copies, reply to our email.</p>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit query'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function NewTicketPage() {
  return <Suspense fallback={null}><Form /></Suspense>;
}
