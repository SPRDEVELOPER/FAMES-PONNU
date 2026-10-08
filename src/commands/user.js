const config = require('../config');
const users = require('../database/userService');
const ui = require('../utils/ui');
const views = require('../handlers/views');
const { startGame } = require('../games/session');

function register(bot) {
  bot.start(views.showWelcome);
  bot.command('help', views.showHelp);
  bot.command('flames', startGame);
  bot.command('result', views.showLatestResult);
  bot.command('leaderboard', (ctx) => views.showLeaderboard(ctx, 0));
  bot.command('cancel', views.cancelGame);

  // /stats → personal stats. Admins can use "/stats all" for the global dashboard.
  bot.command('stats', async (ctx) => {
    const arg = ctx.message.text.split(/\s+/)[1];
    if (arg && /^(all|global)$/i.test(arg) && config.adminIds.includes(ctx.from.id)) {
      return ctx.reply(ui.dashboard(await users.adminStats()));
    }
    return views.showStats(ctx);
  });
}

module.exports = { register };
