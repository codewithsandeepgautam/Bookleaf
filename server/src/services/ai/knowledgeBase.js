/**
 * BookLeaf Knowledge Base, split into small sections so each LLM call only receives
 * what it needs (cost control). `getKnowledge(category)` returns overview + tone +
 * the policy sections relevant to the ticket category + one calibration example.
 */
const SECTIONS = {
  overview: `BookLeaf Publishing is a self-publishing company in India and the US. Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium paid package with marketing and distribution add-ons). We handle cover design, typesetting, ISBN assignment, printing, distribution and royalty management. In-house printing facility and warehouse are in Delhi; print partners are Repro India and Epitome Books.`,

  royalty: `ROYALTY POLICY
- 80/20 split: 80% of net profit per book goes to the author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart) and shipping charges.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold: Rs 1,000. Below this, royalties roll over to the next quarter.
- Payouts go by bank transfer to the account linked in the author's dashboard (check bank details are linked).
- Authors can see a detailed royalty breakdown with sales per platform in their dashboard; we can also share a line-by-line breakdown on request.`,

  isbn: `ISBN POLICY
- Every book gets a unique ISBN assigned by BookLeaf, registered under BookLeaf's publisher imprint. An ISBN under the author's own imprint must be obtained by the author independently.
- ISBN errors (duplicate, wrong book linked, mismatch between platform and physical copy) are HIGH priority and are escalated to the production team immediately.`,

  printing: `PRINTING & QUALITY
- In-house printing handles most orders; overflow or specific formats go to Repro India or Epitome Books.
- Standard print turnaround: 5-7 business days from order confirmation.
- Quality issues (misprints, binding defects, colour inconsistency): BookLeaf arranges a FREE reprint after verification. The author may need to share photos of the defective copy.`,

  distribution: `DISTRIBUTION & AVAILABILITY
- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK and the BookLeaf Store (only the platforms in the book's own record are actually active for that book).
- New listings go live within 7-10 business days after publication is complete.
- "Unavailable" on a platform usually means a stock sync issue; our team can trigger a re-sync, which takes 24-48 hours.
- Metadata/description updates: submit via dashboard or email the BookLeaf team; changes reflect on platforms in 3-5 business days.`,

  production: `PRODUCTION STAGES
Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
Authors are emailed at each stage. Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds). Never blame the author, even if the delay is on their side; frame it collaboratively.`,

  tone: `TONE GUIDELINES
- Empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the concern BEFORE jumping to solutions.
- Be specific: use actual numbers, dates and statuses from the data provided. No vague reassurance.
- If it is BookLeaf's fault (delayed royalty, ISBN error), own it directly. No corporate deflection.
- If it needs escalation/investigation, give a clear timeline (e.g. "within 48 hours"), never open-ended promises.
- Always end with a clear next step for the author and/or the BookLeaf team.`,
};

const EXAMPLES = {
  'Royalty & Payments':
    'Author: "I published 4 months ago and still got no royalty." -> Acknowledge the frustration, explain the quarterly cycle and 45-day window, confirm bank details are linked, give the specific next payout date; if genuinely overdue, escalate with a 48-hour resolution timeline. For "royalty too low": explain net profit (MRP - printing - platform commission - shipping), offer a line-by-line breakdown, do not be defensive.',
  'ISBN & Metadata Issues':
    'Author: "Amazon shows a different ISBN than my physical copy." -> Treat as high priority, say it is a serious data issue, confirm immediate escalation to the production team, give a 48-hour resolution timeline.',
  'Printing & Quality':
    'Author: "Print quality is terrible, blurry images, misaligned pages." -> Apologise sincerely, ask for photos of the defective copies, confirm a free reprint once verified, give 5-7 business days for the reprint.',
  'Distribution & Availability':
    'Author: "Showing Currently Unavailable on Amazon." -> Explain it is typically a stock sync issue, confirm a re-sync is being triggered with the distribution team, expect 24-48 hours.',
  'Book Status & Production Updates':
    'Author: "3 weeks in typesetting, when will it be done?" -> Check the actual production status; if delayed be honest about why; give a specific updated timeline; frame collaboratively.',
  'General Inquiry':
    'Author: "Can I update my book description on Amazon?" -> Yes, via dashboard or emailing the team; changes reflect within 3-5 business days.',
};

const CATEGORY_SECTIONS = {
  'Royalty & Payments': ['royalty'],
  'ISBN & Metadata Issues': ['isbn', 'distribution'],
  'Printing & Quality': ['printing'],
  'Distribution & Availability': ['distribution'],
  'Book Status & Production Updates': ['production'],
  'General Inquiry': ['distribution', 'royalty', 'isbn'],
};

function getKnowledge(category) {
  const keys = CATEGORY_SECTIONS[category] || CATEGORY_SECTIONS['General Inquiry'];
  return [SECTIONS.overview, SECTIONS.tone, ...keys.map((k) => SECTIONS[k]), `CALIBRATION EXAMPLE\n${EXAMPLES[category] || EXAMPLES['General Inquiry']}`].join('\n\n');
}

module.exports = { getKnowledge, SECTIONS };
