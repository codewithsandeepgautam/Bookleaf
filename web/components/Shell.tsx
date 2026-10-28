'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LifeBuoy, LogOut, PlusCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = {
  author: [
    { href: '/author/books', label: 'My Books', icon: BookOpen },
    { href: '/author/tickets/new', label: 'New Query', icon: PlusCircle },
    { href: '/author/tickets', label: 'My Tickets', icon: LifeBuoy },
  ],
  admin: [{ href: '/admin', label: 'Ticket Queue', icon: Inbox }],
};

export function Shell({ role, children }: { role: 'author' | 'admin'; children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = NAV[role];
  const active = (href: string) => (href === '/admin' || href === '/author/tickets' ? pathname === href || (href !== '/admin' && pathname.startsWith(href) && !pathname.startsWith('/author/tickets/new')) : pathname.startsWith(href));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-semibold">BookLeaf <span className="text-muted-foreground font-normal">{role === 'admin' ? 'Ops Console' : 'Author Portal'}</span></span>
          <nav className="flex flex-1 gap-1">
            {items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent', active(href) && 'bg-accent font-medium')}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
          <span className="hidden text-sm text-muted-foreground sm:inline">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4" /> Log out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
