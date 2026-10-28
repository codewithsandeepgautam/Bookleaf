/**
 * Computes the next royalty payout deadline from the policy: quarterly calculation,
 * payout within 45 days of quarter end. Passed to the LLM as a FACT so it never has to
 * do date maths (LLMs are unreliable at this).
 */
const DAY = 86_400_000;

function quarterEnd(year, q) {
  // q = 0..3 ; last day of the quarter
  return new Date(Date.UTC(year, q * 3 + 3, 0));
}

function nextPayoutInfo(now = new Date()) {
  const y = now.getUTCFullYear();
  const q = Math.floor(now.getUTCMonth() / 3);
  const prevEnd = q === 0 ? quarterEnd(y - 1, 3) : quarterEnd(y, q - 1);
  const prevDeadline = new Date(prevEnd.getTime() + 45 * DAY);
  if (now <= prevDeadline) {
    return { quarterEnded: fmt(prevEnd), payoutDueBy: fmt(prevDeadline), note: 'Previous quarter payout is within its 45-day window.' };
  }
  const curEnd = quarterEnd(y, q);
  return { quarterEnded: fmt(curEnd) + ' (current quarter ends)', payoutDueBy: fmt(new Date(curEnd.getTime() + 45 * DAY)), note: 'Next payout is for the current quarter.' };
}

const fmt = (d) => d.toISOString().slice(0, 10);
module.exports = { nextPayoutInfo };
