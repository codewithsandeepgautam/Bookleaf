const OpenAI = require('openai');
const env = require('../../config/env');

class AiUnavailableError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AiUnavailableError';
    this.cause = cause;
  }
}

let client = null;
const isConfigured = () => Boolean(env.OPENAI_API_KEY);

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: env.OPENAI_API_KEY, // server-side only; never serialised into any API response
      baseURL: env.OPENAI_BASE_URL || undefined, // any OpenAI-compatible provider (Groq, Gemini, ...)
      timeout: env.AI_TIMEOUT_MS,
      maxRetries: 1,
    });
  }
  return client;
}

// Tiny circuit breaker: after 3 consecutive failures, skip the provider for 60s so a
// provider outage/rate-limit does not add latency or burn retries on every ticket.
const breaker = { failures: 0, openUntil: 0 };
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60_000;

async function chat({ system, user, json = false, maxTokens = 400, temperature = 0.2 }) {
  if (!isConfigured()) throw new AiUnavailableError('AI is not configured (no API key).');
  if (Date.now() < breaker.openUntil) throw new AiUnavailableError('AI temporarily paused after repeated failures.');

  try {
    const res = await getClient().chat.completions.create({
      model: env.AI_MODEL,
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    breaker.failures = 0;
    const text = res.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty completion');
    return { text, model: res.model || env.AI_MODEL, usage: res.usage };
  } catch (err) {
    breaker.failures += 1;
    if (breaker.failures >= BREAKER_THRESHOLD) breaker.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
    console.warn(`[ai] call failed (${err.status || err.code || err.name}): ${err.message}`);
    throw new AiUnavailableError('AI provider unavailable or rate-limited.', err);
  }
}

module.exports = { chat, isConfigured, AiUnavailableError };
