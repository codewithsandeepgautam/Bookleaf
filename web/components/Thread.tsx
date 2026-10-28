import { cn, fmtDateTime } from '@/lib/utils';
import type { Message } from '@/lib/types';

export function Thread({ original, authorName, createdAt, messages, viewer }: { original: string; authorName: string; createdAt: string; messages: Message[]; viewer: 'author' | 'admin' }) {
  const bubble = (key: string, mine: boolean, name: string, when: string, body: string) => (
    <div key={key} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] rounded-lg border p-3 text-sm', mine ? 'bg-primary/5 border-primary/20' : 'bg-background')}>
        <div className="mb-1 flex gap-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">{name}</span>{fmtDateTime(when)}</div>
        <p className="whitespace-pre-wrap">{body}</p>
      </div>
    </div>
  );
  return (
    <div className="space-y-3">
      {bubble('orig', viewer === 'author', viewer === 'author' ? 'You' : authorName, createdAt, original)}
      {messages.map((m) => bubble(m.id, m.sender === viewer, m.sender === 'author' && viewer === 'author' ? 'You' : m.senderName, m.createdAt, m.body))}
    </div>
  );
}
