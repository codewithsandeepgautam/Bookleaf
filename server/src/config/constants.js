const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

// Lower rank = more urgent / more actionable. Used for the default admin queue sort.
const PRIORITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const STATUS_RANK = { Open: 0, 'In Progress': 1, Resolved: 2, Closed: 3 };

module.exports = { CATEGORIES, PRIORITIES, STATUSES, PRIORITY_RANK, STATUS_RANK };
