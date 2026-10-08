const views = require('./views');
const { ack } = require('./screens');
const { startGame } = require('../games/session');

function register(bot) {
  bot.action('menu', views.showWelcome);
  bot.action('play', startGame);
  bot.action('stats', views.showStats);
  bot.action('help', views.showHelp);
  bot.action('cancel', views.cancelGame);
  bot.action(/^lb:(\d+)$/, (ctx) => views.showLeaderboard(ctx, Number(ctx.match[1]), false));
  bot.action(/^lbp:(\d+)$/, (ctx) => views.showLeaderboard(ctx, Number(ctx.match[1]), true));
  bot.action('noop', (ctx) => ack(ctx));
  // any other (stale) button
  bot.on('callback_query', (ctx) => ack(ctx));
}

module.exports = { register };
