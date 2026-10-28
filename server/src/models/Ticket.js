const { Schema, model } = require('mongoose');
const { CATEGORIES, PRIORITIES, STATUSES, PRIORITY_RANK, STATUS_RANK } = require('../config/constants');

const Counter = model('Counter', new Schema({ _id: String, seq: { type: Number, default: 0 } }));

async function nextTicketNumber() {
  const c = await Counter.findOneAndUpdate({ _id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `BL-${String(c.seq).padStart(5, '0')}`;
}

const messageSchema = new Schema(
  {
    sender: { type: String, enum: ['author', 'admin'], required: true },
    senderName: { type: String, required: true },
    body: { type: String, required: true, maxlength: 5000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const noteSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true, maxlength: 3000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ticketSchema = new Schema(
  {
    ticketNumber: { type: String, unique: true, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    book: { type: Schema.Types.ObjectId, ref: 'Book', default: null }, // null = General / Account Level
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    attachments: [{ name: String, size: Number, _id: false }], // metadata only (UI-only upload)

    status: { type: String, enum: STATUSES, default: 'Open', index: true },
    category: { type: String, enum: CATEGORIES, default: 'General Inquiry', index: true },
    priority: { type: String, enum: PRIORITIES, default: 'Medium', index: true },

    // Provenance of category/priority: lets admin overrides stick and shows trust level in the UI.
    categorySource: { type: String, enum: ['pending', 'ai', 'rules', 'admin'], default: 'pending' },
    prioritySource: { type: String, enum: ['pending', 'ai', 'rules', 'admin'], default: 'pending' },
    aiReasoning: { type: String, default: '' },

    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    messages: [messageSchema],
    internalNotes: [noteSchema],

    aiDraft: {
      text: String,
      source: { type: String, enum: ['ai', 'template'] },
      model: String,
      generatedAt: Date,
      warning: String,
    },

    firstResponseAt: Date,
    lastActivityAt: { type: Date, default: Date.now },

    // Denormalised ranks -> cheap, index-friendly "urgent + oldest first" sort.
    priorityRank: { type: Number, index: true },
    statusRank: { type: Number, index: true },
  },
  { timestamps: true }
);

ticketSchema.index({ statusRank: 1, priorityRank: 1, createdAt: 1 });

ticketSchema.pre('validate', function (next) {
  this.priorityRank = PRIORITY_RANK[this.priority];
  this.statusRank = STATUS_RANK[this.status];
  next();
});

const Ticket = model('Ticket', ticketSchema);
module.exports = Ticket;
module.exports.nextTicketNumber = nextTicketNumber;
module.exports.Counter = Counter;
