const Book = require('../models/Book');
const { asyncHandler } = require('../utils/errors');

const view = (b) => ({
  id: b._id, bookId: b.bookId, title: b.title, isbn: b.isbn, genre: b.genre, publicationDate: b.publicationDate,
  status: b.status, mrp: b.mrp, totalCopiesSold: b.totalCopiesSold, totalRoyaltyEarned: b.totalRoyaltyEarned,
  royaltyPaid: b.royaltyPaid, royaltyPending: b.royaltyPending, lastRoyaltyPayoutDate: b.lastRoyaltyPayoutDate,
  printPartner: b.printPartner, availableOn: b.availableOn,
  inProduction: /production/i.test(b.status),
});

// Authors: only their own books. Admins: all books, optionally ?authorId=AUTH001
const list = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'author' ? { author: req.user._id } : req.query.authorId ? { authorId: String(req.query.authorId) } : {};
  const books = await Book.find(filter).sort({ bookId: 1 });
  res.json({ data: books.map(view) });
});

module.exports = { list };
