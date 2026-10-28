process.env.MONGODB_URI = 'mongodb://x'; process.env.JWT_SECRET = 'x'.repeat(20);
const test = require('node:test');
const assert = require('node:assert');
const { classifyByRules } = require('../services/ai/fallback');
const { classifyTicket } = require('../services/ai/classifier');
const { templateDraft } = require('../services/ai/templates');
const { nextPayoutInfo } = require('../services/ai/royaltySchedule');
const { getKnowledge } = require('../services/ai/knowledgeBase');

test('rules: royalty 6 months => Critical', () => {
  const r = classifyByRules({ subject: 'No royalty', description: 'I have not got any royalty for 6 months' });
  assert.equal(r.category, 'Royalty & Payments'); assert.equal(r.priority, 'Critical');
});
test('rules: ISBN mismatch => High', () => {
  const r = classifyByRules({ subject: 'ISBN', description: 'Wrong ISBN shown on Amazon' });
  assert.equal(r.category, 'ISBN & Metadata Issues'); assert.equal(r.priority, 'High');
});
test('rules: bio update => Low general', () => {
  const r = classifyByRules({ subject: 'Bio', description: 'Can I update my author bio?' });
  assert.equal(r.category, 'General Inquiry'); assert.equal(r.priority, 'Low');
});
test('classifier degrades gracefully without API key', async () => {
  const r = await classifyTicket({ subject: 'Print quality', description: 'The pages are misaligned and blurry', bookTitle: 'X' });
  assert.equal(r.source, 'rules'); assert.equal(r.category, 'Printing & Quality');
});
test('royalty schedule returns a future-ish date', () => {
  assert.match(nextPayoutInfo(new Date('2026-10-27')).payoutDueBy, /^2026-11-14$|^2027-/);
});
test('knowledge is scoped per category (cost control)', () => {
  assert.ok(getKnowledge('Printing & Quality').includes('FREE reprint'));
  assert.ok(!getKnowledge('Printing & Quality').includes('80/20'));
});
test('template draft mentions policy', () => {
  const t = templateDraft({ ticket: { category: 'Royalty & Payments' }, author: { name: 'Priya Sharma' }, book: null, allBooks: [] });
  assert.ok(t.startsWith('Hi Priya') && t.includes('45 days'));
});
