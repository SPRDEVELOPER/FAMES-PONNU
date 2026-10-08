require('dotenv').config();

function required(key) {
  const v = process.env[key];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return v.trim();
}

const num = (key, fallback) => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

module.exports = {
  botToken: required('BOT_TOKEN'),
  mongoUri: required('MONGODB_URI'),
  adminIds: (process.env.ADMIN_ID || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0),
  botUsername: (process.env.BOT_USERNAME || '').replace(/^@/, '').trim(),
  webhookUrl: (process.env.WEBHOOK_URL || '').replace(/\/+$/, ''),
  webhookSecret: (process.env.WEBHOOK_SECRET || '').trim(),
  port: num('PORT', 3000),
  cooldownSeconds: num('GAME_COOLDOWN_SECONDS', 5),
  rateLimitMax: num('RATE_LIMIT_MAX', 10),
  rateLimitWindowMs: num('RATE_LIMIT_WINDOW_SECONDS', 10) * 1000,
};
