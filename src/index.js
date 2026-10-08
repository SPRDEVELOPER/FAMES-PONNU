const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./utils/logger');
const { connectDb } = require('./database/connection');
const { createBot, setupCommands } = require('./bot');

const HOOK_PATH = '/webhook';

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('Body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function main() {
  await connectDb(config.mongoUri);
  const bot = createBot();

  bot.botInfo = await bot.telegram.getMe();
  logger.info(`Logged in as @${bot.botInfo.username}`);
  await setupCommands(bot);

  const useWebhook = Boolean(config.webhookUrl);
  const secret =
    config.webhookSecret ||
    crypto.createHash('sha256').update(config.botToken).digest('hex').slice(0, 32);

  // tiny HTTP server: /health for hosts + webhook endpoint
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('ok');
      }
      if (useWebhook && req.method === 'POST' && req.url === HOOK_PATH) {
        if (req.headers['x-telegram-bot-api-secret-token'] !== secret) {
          res.writeHead(403);
          return res.end();
        }
        const update = JSON.parse(await readBody(req));
        res.writeHead(200);
        res.end();
        bot.handleUpdate(update).catch((e) => logger.error('handleUpdate failed', e));
        return undefined;
      }
      res.writeHead(404);
      return res.end();
    } catch (err) {
      logger.warn('HTTP error:', err.message);
      res.writeHead(400);
      return res.end();
    }
  });
  server.listen(config.port, () => logger.info(`HTTP server on :${config.port}`));

  if (useWebhook) {
    await bot.telegram.setWebhook(`${config.webhookUrl}${HOOK_PATH}`, {
      secret_token: secret,
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query'],
    });
    logger.info(`Webhook mode → ${config.webhookUrl}${HOOK_PATH}`);
  } else {
    bot
      .launch({ dropPendingUpdates: true, allowedUpdates: ['message', 'callback_query'] })
      .catch((e) => { logger.error('Polling stopped', e); process.exit(1); });
    logger.info('Polling mode');
  }

  let closing = false;
  const shutdown = async (sig) => {
    if (closing) return;
    closing = true;
    logger.info(`${sig} received, shutting down...`);
    try { if (!useWebhook) bot.stop(sig); } catch { /* not running */ }
    server.close();
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (err) => logger.error('Unhandled rejection', err));
process.on('uncaughtException', (err) => logger.error('Uncaught exception', err));

main().catch((err) => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});
