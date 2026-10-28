/** Deterministic rules used when the LLM is unavailable (or its output is unusable). */

const CATEGORY_RULES = [
  ['ISBN & Metadata Issues', /\bisbn\b|metadata|wrong book linked|duplicate (book|listing)/i],
  ['Royalty & Payments', /royalt|payout|payment|paid|bank|earning|commission|threshold/i],
  ['Printing & Quality', /print|misprint|blurry|binding|quality|reprint|defect|misalign|colou?r|torn|pages/i],
  ['Distribution & Availability', /unavailable|out of stock|amazon|flipkart|listing|not showing|not available|re-?sync|distribution|store/i],
  ['Book Status & Production Updates', /typeset|proof|cover design|production|when will|status of my book|manuscript|editing|publication date|how long/i],
];

function ruleCategory(text) {
  for (const [cat, re] of CATEGORY_RULES) if (re.test(text)) return cat;
  return 'General Inquiry';
}

function rulePriority(text, category) {
  const t = text.toLowerCase();
  if (/legal|lawyer|court|fraud|scam|cheat|police|consumer forum|defam/.test(t)) return 'Critical';
  if (/(6|six|seven|eight|nine|ten|\d{2,}) months?/.test(t) && category === 'Royalty & Payments') return 'Critical';
  if (category === 'ISBN & Metadata Issues' && /wrong|duplicate|different|mismatch|error|incorrect/.test(t)) return 'High';
  if (/urgent|asap|immediately|not received|never received|haven'?t received|no royalty|unavailable|defective|terrible/.test(t)) return 'High';
  if (/\bcan i\b|\bhow (do|can) i\b|bio\b|update my|curious|suggestion|feedback/.test(t)) return 'Low';
  return 'Medium';
}

function classifyByRules({ subject, description }) {
  const text = `${subject}\n${description}`;
  const category = ruleCategory(text);
  return { category, priority: rulePriority(text, category), reasoning: 'Keyword rules (AI unavailable).', source: 'rules' };
}

module.exports = { classifyByRules, rulePriority, ruleCategory };
