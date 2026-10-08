const ui = require('../utils/ui');
const { handleName } = require('../games/session');

function register(bot) {
  bot.on('text', async (ctx) => {
    const text = ctx.message.text || '';
    if (text.startsWith('/')) return ctx.reply(ui.t.unknownCommand(), ui.kb.main());
    if (ctx.dbUser.state === 'idle') return ctx.reply(ui.t.idleHint(), ui.kb.main());
    return handleName(ctx);
  });

  // stickers, photos, voice, etc.
  bot.on('message', (ctx) => {
    const awaiting = ctx.dbUser && ctx.dbUser.state !== 'idle';
    return ctx.reply(ui.t.unsupported(), awaiting ? ui.kb.cancel() : ui.kb.main());
  });
}

module.exports = { register };
