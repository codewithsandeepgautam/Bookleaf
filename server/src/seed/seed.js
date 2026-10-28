const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Book = require('../models/Book');
const Ticket = require('../models/Ticket');
const data = require(path.join(__dirname, '../../data/bookleaf_sample_data.json'));

const AUTHOR_PASSWORD = 'Author@123';
const ADMINS = [
  { name: 'Aarav Mehta (Ops)', email: 'admin@bookleaf.com' },
  { name: 'Ishita Rao (Support)', email: 'support@bookleaf.com' },
];
const ADMIN_PASSWORD = 'Admin@123';
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  await Promise.all([User.deleteMany({}), Book.deleteMany({}), Ticket.deleteMany({}), Ticket.Counter.deleteMany({})]);

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admins = await User.insertMany(ADMINS.map((a) => ({ ...a, role: 'admin', passwordHash: adminHash })));

  const authorHash = await bcrypt.hash(AUTHOR_PASSWORD, 10);
  const byAuthorId = {};
  let bookCount = 0;
  for (const a of data.authors) {
    const user = await User.create({
      name: a.name, email: a.email, role: 'author', authorId: a.author_id, phone: a.phone, city: a.city,
      joinedDate: a.joined_date, passwordHash: authorHash,
    });
    byAuthorId[a.author_id] = user;
    for (const b of a.books) {
      await Book.create({
        bookId: b.book_id, author: user._id, authorId: a.author_id, title: b.title, isbn: b.isbn, genre: b.genre,
        publicationDate: b.publication_date, status: b.status, mrp: b.mrp, authorRoyaltyPerCopy: b.author_royalty_per_copy,
        totalCopiesSold: b.total_copies_sold, totalRoyaltyEarned: b.total_royalty_earned, royaltyPaid: b.royalty_paid,
        royaltyPending: b.royalty_pending, lastRoyaltyPayoutDate: b.last_royalty_payout_date, printPartner: b.print_partner,
        availableOn: b.available_on,
      });
      bookCount++;
    }
  }

  // Demo tickets (pre-triaged so the queue looks realistic on first load; new tickets go through the live AI pipeline).
  const bk = async (id) => (await Book.findOne({ bookId: id }))._id;
  const demo = [
    { a: 'AUTH003', book: 'BK005', subject: 'No royalty received since publishing', description: 'My book Between Two Temples has been live since July 2024 and I have not received a single royalty payment so far. It has been many months now. Can you tell me what is going on?', category: 'Royalty & Payments', priority: 'High', age: 6, status: 'Open' },
    { a: 'AUTH007', book: 'BK013', subject: 'Midnight in Mysore stuck at cover design?', description: 'It has been over a month and my thriller is still marked In Production - Cover Design. When will it be completed? I have not received any update by email either.', category: 'Book Status & Production Updates', priority: 'Medium', age: 4, status: 'In Progress', assign: 0 },
    { a: 'AUTH002', book: 'BK003', subject: 'Different ISBN on Amazon vs my physical copy', description: 'The ISBN printed on the physical copy of Code & Karma does not match the one shown on the Amazon India listing. Readers are getting confused. Please fix this urgently.', category: 'ISBN & Metadata Issues', priority: 'High', age: 3, status: 'Open' },
    { a: 'AUTH010', book: null, subject: 'Can I update my author bio?', description: 'I would like to change my author bio across my books. Is that possible after publication, and how long does it take to reflect?', category: 'General Inquiry', priority: 'Low', age: 2, status: 'Open' },
    { a: 'AUTH001', book: 'BK001', subject: 'Print quality of my latest author copies', description: 'The author copies I received yesterday have blurry images and several pages are misaligned. I am not happy with this quality for a book I am proud of.', category: 'Printing & Quality', priority: 'High', age: 9, status: 'Resolved', assign: 1,
      reply: 'Hi Priya,\n\nI am sorry the copies you received did not meet the standard we hold ourselves to. Please share photos of the blurry pages and the misalignment and we will arrange a free reprint once verified; reprints take 5-7 business days.\n\nTeam BookLeaf - Author Support' },
  ];
  for (const d of demo) {
    const author = byAuthorId[d.a];
    const t = new Ticket({
      ticketNumber: await Ticket.nextTicketNumber(), author: author._id, book: d.book ? await bk(d.book) : null,
      subject: d.subject, description: d.description, category: d.category, priority: d.priority,
      categorySource: 'ai', prioritySource: 'ai', aiReasoning: 'Seeded demo ticket.', status: d.status,
      assignedTo: d.assign !== undefined ? admins[d.assign]._id : null,
    });
    t.createdAt = daysAgo(d.age);
    t.lastActivityAt = daysAgo(d.age);
    if (d.reply) { t.messages.push({ sender: 'admin', senderName: 'BookLeaf Support', body: d.reply }); t.firstResponseAt = daysAgo(d.age - 1); }
    await t.save();
    // timestamps option overrides createdAt on create; force it for ageing demo
    await Ticket.collection.updateOne({ _id: t._id }, { $set: { createdAt: daysAgo(d.age) } });
  }

  console.log(`Seeded ${admins.length} admins, ${data.authors.length} authors, ${bookCount} books, ${demo.length} tickets.`);
  console.log(`Admin login : ${ADMINS[0].email} / ${ADMIN_PASSWORD}`);
  console.log(`Author login: priya.sharma@email.com / ${AUTHOR_PASSWORD}  (all authors share this password)`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
