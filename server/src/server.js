const env = require('./config/env');
const { connectDb } = require('./config/db');
const app = require('./app');
const { isConfigured } = require('./services/ai/llm');

(async () => {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`API listening on :${env.PORT}`);
    console.log(isConfigured() ? `AI enabled (model: ${env.AI_MODEL})` : 'AI disabled: no API key -> rule-based triage + template drafts');
  });
})().catch((e) => {
  console.error('Failed to start', e);
  process.exit(1);
});
