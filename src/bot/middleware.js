const config = require('../config');
const users = require('../database/userService');
const { isConnected } = require('../database/connection');
const ui = require('../utils/ui');
const logger = require('../utils/logger');

/** only private chats, only real users */
const privateOnly = async (ctx, next) => {
  if (!ctx.from || ctx.from.is_bot) return undefined;
  if (ctx.chat && ctx.chat.type !== 'private') return undefined;
  return next();
};

/** sliding-window rate limit per user */
function rateLimit() {
  const hits = new Map();
  setInterval(() => {
    const cutoff = Date.now() - config.rateLimitWindowMs;
    for (const [id, arr] of hits) if (!arr.length || arr[arr.length - 1] < cutoff) hits.delete(id);
  }, 60_000).unref();

  return async (ctx, next) => {
    const id = ctx.from.id;
    const now = Date.now();
    const arr = (hits.get(id) || []).filter((t) => now - t < config.rateLimitWindowMs);
    arr.push(now);
    hits.set(id, arr);

    if (arr.length > config.rateLimitMax) {
      if (arr.length === config.rateLimitMax + 1) await ctx.reply(ui.t.slowDown()).catch(() => {});
      if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});
      return undefined;
    }
    return next();
  };
}

/** loads/creates the user, blocks banned users, survives DB outages */
const loadUser = async (ctx, next) => {
  if (!isConnected()) {
    await ctx.reply(ui.t.unavailable()).catch(() => {});
    return undefined;
  }
  try {
    ctx.dbUser = await users.upsertUser(ctx.from);
  } catch (err) {
    logger.error('upsertUser failed', err);
    await ctx.reply(ui.t.unavailable()).catch(() => {});
    return undefined;
  }
  if (ctx.dbUser.banned) {
    if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});
    else await ctx.reply(ui.t.banned()).catch(() => {});
    return undefined;
  }
  return next();
};

/** global error handler - users never see stack traces */
async function onError(err, ctx) {
  logger.error(`Unhandled error for update ${ctx && ctx.update && ctx.update.update_id}`, err);
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});
    await ctx.reply(ui.t.genericError(), ui.kb.main());
  } catch (e) {
    logger.warn('Could not send error message:', e.message);
  }
}

module.exports = { privateOnly, rateLimit, loadUser, onError };
