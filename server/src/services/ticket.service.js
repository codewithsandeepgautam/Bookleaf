const Ticket = require('../models/Ticket');
const Book = require('../models/Book');
const User = require('../models/User');
const { ApiError } = require('../utils/errors');
const { classifyTicket } = require('./ai/classifier');
const { generateDraft } = require('./ai/drafter');
const { PRIORITY_RANK } = require('../config/constants');

const POPULATE = [
  { path: 'book', select: 'bookId title status' },
  { path: 'author', select: 'name email authorId' },
  { path: 'assignedTo', select: 'name email' },
];

/** Authors can only ever load their own tickets; a foreign id looks like "not found" (no leak). */
async function loadAccessible(id, user) {
  const ticket = await Ticket.findById(id).populate(POPULATE);
  if (!ticket) throw new ApiError(404, 'TICKET_NOT_FOUND', 'Ticket not found.');
  if (user.role === 'author' && String(ticket.author._id) !== String(user._id)) {
    throw new ApiError(404, 'TICKET_NOT_FOUND', 'Ticket not found.');
  }
  return ticket;
}

async function createTicket(user, { bookId, subject, description, attachments }) {
  let book = null;
  if (bookId) {
    book = await Book.findOne({ bookId, author: user._id });
    if (!book) throw new ApiError(404, 'BOOK_NOT_FOUND', 'That book is not on your account.');
  }
  const ticket = await Ticket.create({
    ticketNumber: await Ticket.nextTicketNumber(),
    author: user._id, book: book?._id || null, subject, description, attachments: attachments || [],
  });
  // Fire-and-forget: the ticket is saved and returned immediately; AI triage updates it shortly after.
  setImmediate(() => classifyAndUpdate(ticket._id).catch((e) => console.error('[triage] failed', e)));
  return loadAccessible(ticket._id, user);
}

async function classifyAndUpdate(ticketId, { force = false } = {}) {
  const t = await Ticket.findById(ticketId).populate('book', 'title');
  if (!t) return null;
  const res = await classifyTicket({ subject: t.subject, description: t.description, bookTitle: t.book?.title });

  // Re-read right before writing; never overwrite an admin override (unless force = explicit reclassify).
  const fresh = await Ticket.findById(ticketId);
  if (force || fresh.categorySource !== 'admin') { fresh.category = res.category; fresh.categorySource = res.source; }
  if (force || fresh.prioritySource !== 'admin') { fresh.priority = res.priority; fresh.prioritySource = res.source; }
  fresh.aiReasoning = res.reasoning || '';
  await fresh.save();
  return fresh;
}

async function addMessage(user, id, { body, status }) {
  const t = await loadAccessible(id, user);
  const now = new Date();
  if (user.role === 'author') {
    if (t.status === 'Closed') throw new ApiError(409, 'TICKET_CLOSED', 'This ticket is closed. Please open a new query.');
    t.messages.push({ sender: 'author', senderName: user.name, body });
    if (t.status === 'Resolved') t.status = 'Open'; // author replied -> reopen
  } else {
    t.messages.push({ sender: 'admin', senderName: 'BookLeaf Support', body });
    if (!t.assignedTo) t.assignedTo = user._id;
    if (!t.firstResponseAt) t.firstResponseAt = now;
    t.status = status || (t.status === 'Open' ? 'In Progress' : t.status);
  }
  t.lastActivityAt = now;
  await t.save();
  return loadAccessible(id, user);
}

async function updateTicket(user, id, { status, category, priority, assignedTo }) {
  const t = await loadAccessible(id, user);
  if (status) t.status = status;
  if (category && category !== t.category) { t.category = category; t.categorySource = 'admin'; t.aiDraft = undefined; /* draft was for old category */ }
  if (priority && priority !== t.priority) { t.priority = priority; t.prioritySource = 'admin'; }
  if (assignedTo !== undefined) {
    if (assignedTo === null) t.assignedTo = null;
    else t.assignedTo = assignedTo === 'me' ? user._id : (await requireAdmin(assignedTo))._id;
  }
  t.lastActivityAt = new Date();
  await t.save();
  return loadAccessible(id, user);
}

async function requireAdmin(userId) {
  const u = await User.findOne({ _id: userId, role: 'admin' });
  if (!u) throw new ApiError(422, 'INVALID_ASSIGNEE', 'Assignee must be an admin user.');
  return u;
}

async function addNote(user, id, body) {
  const t = await loadAccessible(id, user);
  t.internalNotes.push({ author: user._id, authorName: user.name, body });
  await t.save();
  return loadAccessible(id, user);
}

async function regenerateDraft(user, id) {
  const t = await loadAccessible(id, user);
  const authorDoc = await User.findById(t.author._id);
  const book = t.book ? await Book.findById(t.book._id) : null;
  const allBooks = book ? [] : await Book.find({ author: authorDoc._id });
  t.aiDraft = await generateDraft({ ticket: t, author: authorDoc, book, allBooks });
  await t.save();
  return t.aiDraft;
}

async function reclassify(user, id) {
  await loadAccessible(id, user);
  await classifyAndUpdate(id, { force: true });
  return loadAccessible(id, user);
}

function buildFilter(q, user) {
  const f = {};
  if (user.role === 'author') f.author = user._id;
  if (q.status) f.status = q.status;
  if (q.category) f.category = q.category;
  if (q.priority) f.priority = q.priority;
  if (q.assigned === 'me') f.assignedTo = user._id;
  else if (q.assigned === 'unassigned') f.assignedTo = null;
  if (q.from || q.to) f.createdAt = { ...(q.from && { $gte: q.from }), ...(q.to && { $lte: q.to }) };
  if (q.q) {
    const rx = new RegExp(q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    f.$or = [{ subject: rx }, { ticketNumber: rx }, { description: rx }];
  }
  return f;
}

const SORTS = {
  urgency: { statusRank: 1, priorityRank: 1, createdAt: 1 }, // active first, most urgent, then oldest
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  activity: { lastActivityAt: -1 },
};

async function listTickets(user, q) {
  const filter = buildFilter(q, user);
  const sort = user.role === 'author' ? SORTS.activity : SORTS[q.sort];
  const [items, total] = await Promise.all([
    Ticket.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit).populate(POPULATE),
    Ticket.countDocuments(filter),
  ]);
  return { items, total };
}

async function stats() {
  const active = { status: { $in: ['Open', 'In Progress'] } };
  const overdueBefore = new Date(Date.now() - 48 * 3600 * 1000);
  const [byStatus, byPriority, overdue, unassigned] = await Promise.all([
    Ticket.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Ticket.aggregate([{ $match: active }, { $group: { _id: '$priority', n: { $sum: 1 } } }]),
    Ticket.countDocuments({ ...active, createdAt: { $lt: overdueBefore } }),
    Ticket.countDocuments({ ...active, assignedTo: null }),
  ]);
  const toMap = (arr) => Object.fromEntries(arr.map((x) => [x._id, x.n]));
  return { byStatus: toMap(byStatus), activeByPriority: toMap(byPriority), overdue48h: overdue, unassigned };
}

module.exports = { createTicket, addMessage, updateTicket, addNote, regenerateDraft, reclassify, listTickets, loadAccessible, stats, PRIORITY_RANK };
