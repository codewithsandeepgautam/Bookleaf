const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const s = require('./schemas');
const auth = require('../controllers/auth.controller');
const books = require('../controllers/book.controller');
const tickets = require('../controllers/ticket.controller');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../config/constants');
const { isConfigured } = require('../services/ai/llm');

const r = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' } } });
const createLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Ticket limit reached. Try again later.' } } });

// ---- public ----
r.get('/health', (_req, res) => res.json({ status: 'ok', aiConfigured: isConfigured() }));
r.post('/auth/login', loginLimiter, validate(s.loginBody), auth.login);

// ---- everything below requires a valid JWT ----
r.use(authenticate);
r.get('/auth/me', auth.me);
r.get('/meta', (_req, res) => res.json({ categories: CATEGORIES, priorities: PRIORITIES, statuses: STATUSES }));

r.get('/books', books.list); // role-scoped inside controller

r.get('/tickets', validate(s.listQuery, 'query'), tickets.list); // role-scoped inside service
r.post('/tickets', requireRole('author'), createLimiter, validate(s.createTicketBody), tickets.create);
r.get('/tickets/stats', requireRole('admin'), tickets.stats); // must precede /tickets/:id
r.get('/tickets/:id', tickets.get);
r.post('/tickets/:id/messages', validate(s.messageBody), (req, _res, next) => {
  if (req.user.role === 'author') delete req.body.status; // authors cannot change status
  next();
}, tickets.addMessage);

// ---- admin only ----
r.patch('/tickets/:id', requireRole('admin'), validate(s.updateTicketBody), tickets.update);
r.post('/tickets/:id/notes', requireRole('admin'), validate(s.noteBody), tickets.addNote);
r.post('/tickets/:id/draft', requireRole('admin'), tickets.draft);
r.post('/tickets/:id/reclassify', requireRole('admin'), tickets.reclassify);

module.exports = r;
