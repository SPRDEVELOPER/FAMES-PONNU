const config = require('../config');
const users = require('../database/userService');
const ui = require('../utils/ui');
const { sc } = require('../utils/smallcaps');
const logger = require('../utils/logger');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isAdmin = (ctx) => config.adminIds.includes(ctx.from.id);
const pending = new Map(); // adminId -> broadcast text awaiting confirmation

const adminOnly = (fn) => async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply(ui.t.adminOnly());
  return fn(ctx);
};

const args = (ctx) => ctx.message.text.replace(/^\/\w+(@\w+)?\s*/, '').trim();

async function sendWithRetry(telegram, id, text) {
  try {
    await telegram.sendMessage(id, text);
    return true;
  } catch (err) {
    const wait = err.response && err.response.parameters && err.response.parameters.retry_after;
    if (wait) {
      await sleep((wait + 1) * 1000);
      try { await telegram.sendMessage(id, text); return true; } catch { return false; }
    }
    return false; // blocked the bot, deleted account, etc.
  }
}

async function runBroadcast(telegram, text) {
  let sent = 0;
  let failed = 0;
  for await (const u of users.broadcastCursor()) {
    (await sendWithRetry(telegram, u.telegramId, text)) ? sent++ : failed++;
    await sleep(50); // stay under Telegram's ~30 msg/s limit
  }
  return { sent, failed };
}

function register(bot) {
  bot.command('admin', adminOnly(async (ctx) => ctx.reply(ui.dashboard(await users.adminStats()))));

  bot.command('users', adminOnly(async (ctx) => {
    const page = Math.max(0, (parseInt(args(ctx), 10) || 1) - 1);
    const d = await users.listUsers(page);
    const lines = ['👥 USERS', ui.LINE];
    for (const u of d.rows) {
      lines.push(
        `${u.telegramId} · ${(u.firstName || '-').slice(0, 16)}${u.username ? ` @${u.username}` : ''} · ${u.totalGames}${u.banned ? ' 🚫' : ''}`
      );
    }
    lines.push('', `page ${d.page + 1}/${d.pages} · ${d.total} users`);
    return ctx.reply(sc(lines.join('\n')));
  }));

  bot.command('ban', adminOnly(async (ctx) => {
    const id = Number(args(ctx).split(/\s+/)[0]);
    if (!Number.isInteger(id) || id <= 0) return ctx.reply(sc('Usage: /ban <user_id>'));
    if (config.adminIds.includes(id)) return ctx.reply(sc('⚠️ You cannot ban an admin.'));
    const ok = await users.setBanned(id, true);
    return ctx.reply(sc(ok ? `🚫 User ${id} banned.` : '⚠️ User not found.'));
  }));

  bot.command('unban', adminOnly(async (ctx) => {
    const id = Number(args(ctx).split(/\s+/)[0]);
    if (!Number.isInteger(id) || id <= 0) return ctx.reply(sc('Usage: /unban <user_id>'));
    const ok = await users.setBanned(id, false);
    return ctx.reply(sc(ok ? `✅ User ${id} unbanned.` : '⚠️ User not found.'));
  }));

  bot.command('broadcast', adminOnly(async (ctx) => {
    const text = args(ctx);
    if (!text) return ctx.reply(sc('Usage: /broadcast <message>'));
    if (text.length > 3500) return ctx.reply(sc('⚠️ Message too long (max 3500 characters).'));
    pending.set(ctx.from.id, text);
    return ctx.reply(sc('📢 PREVIEW\n\n') + sc(text) + '\n\n' + sc('Send this to all users?'), ui.kb.broadcastConfirm());
  }));

  bot.action('bc:no', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    pending.delete(ctx.from.id);
    return ctx.editMessageText(sc('❌ Broadcast cancelled.')).catch(() => {});
  });

  bot.action('bc:yes', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    if (!isAdmin(ctx)) return undefined;
    const text = pending.get(ctx.from.id);
    if (!text) return ctx.editMessageText(sc('⚠️ Nothing to send.')).catch(() => {});
    pending.delete(ctx.from.id);
    await ctx.editMessageText(sc('📤 Sending broadcast...')).catch(() => {});
    const body = sc('📢 ANNOUNCEMENT\n\n') + sc(text);
    runBroadcast(ctx.telegram, body)
      .then(({ sent, failed }) =>
        ctx.reply(sc(`✅ Broadcast finished\n📨 Sent: ${sent}\n⚠️ Failed: ${failed}`))
      )
      .catch((err) => logger.error('Broadcast failed', err));
    return undefined;
  });
}

module.exports = { register, isAdmin };
