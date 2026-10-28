const { Schema, model } = require('mongoose');

const bookSchema = new Schema(
  {
    bookId: { type: String, required: true, unique: true }, // BK001
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorId: { type: String, required: true },
    title: { type: String, required: true },
    isbn: String,
    genre: String,
    publicationDate: { type: Date, default: null },
    status: { type: String, required: true },
    mrp: { type: Number, default: null },
    authorRoyaltyPerCopy: { type: Number, default: null },
    totalCopiesSold: { type: Number, default: 0 },
    totalRoyaltyEarned: { type: Number, default: 0 },
    royaltyPaid: { type: Number, default: 0 },
    royaltyPending: { type: Number, default: 0 },
    lastRoyaltyPayoutDate: { type: Date, default: null },
    printPartner: { type: String, default: null },
    availableOn: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = model('Book', bookSchema);
