const { nextPayoutInfo } = require('./royaltySchedule');
const inr = (n) => `Rs ${Number(n || 0).toLocaleString('en-IN')}`;

/** Static, KB-accurate drafts used only when the LLM is down. Admin still reviews before sending. */
function templateDraft({ ticket, author, book, allBooks }) {
  const first = (author.name || 'there').split(' ')[0];
  const title = book ? `"${book.title}"` : 'your account';
  const sign = '\n\nTeam BookLeaf - Author Support';
  const open = `Hi ${first},\n\nThank you for reaching out about ${title}, and we are sorry for the trouble.`;
  const b = book || (allBooks || []).find((x) => x.royaltyPending > 0) || (allBooks || [])[0];

  switch (ticket.category) {
    case 'Royalty & Payments': {
      const p = nextPayoutInfo();
      const facts = b && b.totalRoyaltyEarned > 0
        ? ` For "${b.title}", royalties earned are ${inr(b.totalRoyaltyEarned)}, paid ${inr(b.royaltyPaid)} and pending ${inr(b.royaltyPending)}.`
        : '';
      return `${open} Royalties are calculated quarterly and paid within 45 days of quarter end; the next payout is due by ${p.payoutDueBy}. Amounts below Rs 1,000 roll over to the next quarter.${facts} Please confirm your bank details are linked in your dashboard. If anything looks overdue, our team will investigate and reply within 48 hours.${sign}`;
    }
    case 'ISBN & Metadata Issues':
      return `${open} An ISBN mismatch is a serious data issue and we treat it as high priority. We are escalating this to our production team right now and will confirm the resolution within 48 hours.${sign}`;
    case 'Printing & Quality':
      return `${open} Please share clear photos of the defective copies. Once verified, we will arrange a free reprint, which takes 5-7 business days from order confirmation.${sign}`;
    case 'Distribution & Availability':
      return `${open} This usually points to a stock sync issue. We are triggering a re-sync with our distribution team; it normally goes live again within 24-48 hours and we will confirm once done.${sign}`;
    case 'Book Status & Production Updates':
      return `${open} ${book ? `Your book is currently at the stage: ${book.status}.` : 'We are checking the exact stage of your book.'} Our team will confirm the updated timeline within 48 hours.${sign}`;
    default:
      return `${open} Our team will review your request and reply with a clear answer within 48 hours. Metadata and description updates can be submitted via your dashboard and reflect on platforms in 3-5 business days.${sign}`;
  }
}
module.exports = { templateDraft };
