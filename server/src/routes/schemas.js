const { z } = require('zod');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../config/constants');

const loginBody = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

const createTicketBody = z.object({
  bookId: z.string().trim().min(1).nullish().transform((v) => v || null), // null / "" = General / Account Level
  subject: z.string().trim().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().trim().min(20, 'Please describe the issue in at least 20 characters').max(5000),
  attachments: z.array(z.object({ name: z.string().max(200), size: z.number().int().nonnegative().max(25_000_000) })).max(5).optional(),
});

const messageBody = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(5000),
  status: z.enum(STATUSES).optional(), // only honoured for admins
});

const updateTicketBody = z
  .object({
    status: z.enum(STATUSES).optional(),
    category: z.enum(CATEGORIES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    assignedTo: z.union([z.literal('me'), z.string().regex(/^[a-f\d]{24}$/i), z.null()]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

const noteBody = z.object({ body: z.string().trim().min(1).max(3000) });

const listQuery = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigned: z.enum(['me', 'unassigned']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['urgency', 'newest', 'oldest']).default('urgency'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

module.exports = { loginBody, createTicketBody, messageBody, updateTicketBody, noteBody, listQuery };
