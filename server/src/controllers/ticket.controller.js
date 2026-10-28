const svc = require('../services/ticket.service');
const { authorTicket, adminTicket } = require('../services/serializers');
const { asyncHandler } = require('../utils/errors');

const present = (user, t, opts) => (user.role === 'admin' ? adminTicket(t, opts) : authorTicket(t, opts));

const list = asyncHandler(async (req, res) => {
  const q = req.validQuery;
  const { items, total } = await svc.listTickets(req.user, q);
  res.json({ data: items.map((t) => present(req.user, t, { detail: false })), meta: { page: q.page, limit: q.limit, total } });
});

const create = asyncHandler(async (req, res) => {
  const t = await svc.createTicket(req.user, req.body);
  res.status(201).json({ data: present(req.user, t) });
});

const get = asyncHandler(async (req, res) => {
  const t = await svc.loadAccessible(req.params.id, req.user);
  res.json({ data: present(req.user, t) });
});

const addMessage = asyncHandler(async (req, res) => {
  const t = await svc.addMessage(req.user, req.params.id, req.body);
  res.status(201).json({ data: present(req.user, t) });
});

const update = asyncHandler(async (req, res) => {
  res.json({ data: adminTicket(await svc.updateTicket(req.user, req.params.id, req.body)) });
});

const addNote = asyncHandler(async (req, res) => {
  res.status(201).json({ data: adminTicket(await svc.addNote(req.user, req.params.id, req.body.body)) });
});

const draft = asyncHandler(async (req, res) => {
  res.json({ data: await svc.regenerateDraft(req.user, req.params.id) });
});

const reclassify = asyncHandler(async (req, res) => {
  res.json({ data: adminTicket(await svc.reclassify(req.user, req.params.id)) });
});

const stats = asyncHandler(async (_req, res) => res.json({ data: await svc.stats() }));

module.exports = { list, create, get, addMessage, update, addNote, draft, reclassify, stats };
