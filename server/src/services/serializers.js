/** What each role is allowed to see. Internal notes, AI draft and AI metadata never reach authors. */
const msg = (m) => ({ id: m._id, sender: m.sender, senderName: m.senderName, body: m.body, createdAt: m.createdAt });
const bookRef = (b) => (b && b.title ? { bookId: b.bookId, title: b.title, status: b.status } : null);

function authorTicket(t, { detail = true } = {}) {
  const o = {
    id: t._id, ticketNumber: t.ticketNumber, subject: t.subject, description: t.description,
    status: t.status, category: t.category, book: bookRef(t.book), attachments: t.attachments,
    responseCount: t.messages.filter((m) => m.sender === 'admin').length,
    createdAt: t.createdAt, updatedAt: t.updatedAt, lastActivityAt: t.lastActivityAt,
  };
  if (detail) o.messages = t.messages.map(msg);
  return o;
}

function adminTicket(t, { detail = true } = {}) {
  const user = (u) => (u && u.name ? { id: u._id, name: u.name, email: u.email, authorId: u.authorId } : null);
  const o = {
    id: t._id, ticketNumber: t.ticketNumber, subject: t.subject, description: t.description,
    status: t.status, category: t.category, priority: t.priority,
    categorySource: t.categorySource, prioritySource: t.prioritySource, aiReasoning: t.aiReasoning,
    book: bookRef(t.book), author: user(t.author), assignedTo: user(t.assignedTo),
    attachments: t.attachments, messageCount: t.messages.length,
    lastMessage: t.messages.length ? msg(t.messages[t.messages.length - 1]) : null,
    firstResponseAt: t.firstResponseAt, createdAt: t.createdAt, updatedAt: t.updatedAt, lastActivityAt: t.lastActivityAt,
  };
  if (detail) {
    o.messages = t.messages.map(msg);
    o.internalNotes = t.internalNotes.map((n) => ({ id: n._id, authorName: n.authorName, body: n.body, createdAt: n.createdAt }));
    o.aiDraft = t.aiDraft && t.aiDraft.text ? t.aiDraft : null;
  }
  return o;
}

module.exports = { authorTicket, adminTicket };
