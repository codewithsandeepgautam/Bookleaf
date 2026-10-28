import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

const statusV: Record<string, any> = { Open: 'blue', 'In Progress': 'yellow', Resolved: 'green', Closed: 'slate' };
const prioV: Record<string, any> = { Critical: 'red', High: 'orange', Medium: 'yellow', Low: 'slate' };

export const StatusBadge = ({ status }: { status: string }) => <Badge variant={statusV[status] || 'slate'}>{status}</Badge>;
export const PriorityBadge = ({ priority }: { priority?: string }) => (priority ? <Badge variant={prioV[priority] || 'slate'}>{priority}</Badge> : null);

/** Shows where a category/priority came from, so admins know how much to trust it. */
export function SourceTag({ source }: { source?: string }) {
  if (!source || source === 'pending') return <span className="text-xs text-muted-foreground">classifying…</span>;
  if (source === 'ai') return <span className="inline-flex items-center gap-1 text-xs text-purple-700"><Sparkles className="h-3 w-3" />AI</span>;
  if (source === 'rules') return <span className="text-xs text-amber-700" title="AI was unavailable; keyword rules were used">rules</span>;
  return <span className="text-xs text-muted-foreground">admin</span>;
}
