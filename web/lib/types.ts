export type Role = 'author' | 'admin';
export interface User { id: string; name: string; email: string; role: Role; authorId?: string; city?: string }
export interface Book {
  id: string; bookId: string; title: string; isbn: string; genre: string; publicationDate: string | null; status: string;
  mrp: number | null; totalCopiesSold: number; totalRoyaltyEarned: number; royaltyPaid: number; royaltyPending: number;
  lastRoyaltyPayoutDate: string | null; printPartner: string | null; availableOn: string[]; inProduction: boolean;
}
export interface Message { id: string; sender: 'author' | 'admin'; senderName: string; body: string; createdAt: string }
export interface Note { id: string; authorName: string; body: string; createdAt: string }
export interface Draft { text: string; source: 'ai' | 'template'; model?: string; generatedAt: string; warning?: string }
export interface Ticket {
  id: string; ticketNumber: string; subject: string; description: string; status: string; category: string; priority?: string;
  categorySource?: string; prioritySource?: string; aiReasoning?: string;
  book: { bookId: string; title: string; status: string } | null;
  author?: { id: string; name: string; email: string; authorId: string } | null;
  assignedTo?: { id: string; name: string } | null;
  attachments: { name: string; size: number }[];
  messages?: Message[]; internalNotes?: Note[]; aiDraft?: Draft | null;
  responseCount?: number; messageCount?: number; lastMessage?: Message | null;
  createdAt: string; updatedAt: string; lastActivityAt: string;
}
