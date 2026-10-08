const images = require('../config/images');
const logger = require('../utils/logger');

/** send a screen (photo + caption when artwork exists, text otherwise) */
async function screen(ctx, key, text, extra = {}) {
  if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => {});
  const img = images.resolve(key);
  if (img && text.length <= 1024) {
    try {
      const msg = await ctx.replyWithPhoto(img, { caption: text, ...extra });
      images.remember(key, msg);
      return msg;
    } catch (err) {
      logger.warn(`Could not send image "${key}": ${err.message}`);
      images.forget(key);
    }
  }
  return ctx.reply(text, extra);
}

/** edit the current message in place (used for leaderboard pages) */
async function edit(ctx, key, text, extra = {}) {
  const msg = ctx.callbackQuery && ctx.callbackQuery.message;
  if (!msg) return screen(ctx, key, text, extra);
  try {
    if (msg.photo) await ctx.editMessageCaption(text, extra);
    else await ctx.editMessageText(text, extra);
  } catch (err) {
    if (/not modified/i.test(err.message)) return undefined;
    return screen(ctx, key, text, extra);
  }
  return undefined;
}

const ack = (ctx, text) =>
  ctx.callbackQuery ? ctx.answerCbQuery(text).catch(() => {}) : Promise.resolve();

module.exports = { screen, edit, ack };
