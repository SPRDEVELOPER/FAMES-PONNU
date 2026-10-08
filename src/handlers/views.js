const config = require('../config');
const users = require('../database/userService');
const ui = require('../utils/ui');
const { screen, edit, ack } = require('./screens');

const botUsername = (ctx) => config.botUsername || (ctx.botInfo && ctx.botInfo.username) || '';

async function showWelcome(ctx) {
  await ack(ctx);
  await users.resetState(ctx.from.id);
  return screen(ctx, 'welcome', ui.welcome(), ui.kb.main());
}

async function showHelp(ctx) {
  await ack(ctx);
  return screen(ctx, 'help', ui.help(), ui.kb.back());
}

async function showStats(ctx) {
  await ack(ctx);
  const user = await users.getUser(ctx.from.id);
  return screen(ctx, 'stats', ui.statsCard(user || {}), ui.kb.back());
}

async function showLeaderboard(ctx, page = 0, inPlace = false) {
  await ack(ctx);
  const data = await users.leaderboard(page);
  const text = ui.leaderboardCard(data);
  const extra = ui.kb.leaderboard(data.page, data.pages);
  return inPlace ? edit(ctx, 'leaderboard', text, extra) : screen(ctx, 'leaderboard', text, extra);
}

async function showLatestResult(ctx) {
  await ack(ctx);
  const game = await users.getLatestGame(ctx.from.id);
  if (!game) return screen(ctx, 'welcome', ui.t.noResult(), ui.kb.main());
  return screen(ctx, `result_${game.result}`, ui.resultCard(game), ui.kb.result(game, botUsername(ctx)));
}

async function cancelGame(ctx) {
  await ack(ctx);
  const user = ctx.dbUser;
  if (!user || user.state === 'idle') {
    if (ctx.callbackQuery) return showWelcome(ctx);
    return ctx.reply(ui.t.nothingToCancel(), ui.kb.main());
  }
  await users.resetState(ctx.from.id);
  return screen(ctx, 'welcome', ui.t.cancelled(), ui.kb.main());
}

module.exports = { botUsername, showWelcome, showHelp, showStats, showLeaderboard, showLatestResult, cancelGame };
