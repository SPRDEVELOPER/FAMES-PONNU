const config = require('../config');
const users = require('../database/userService');
const ui = require('../utils/ui');
const logger = require('../utils/logger');
const { sc } = require('../utils/smallcaps');
const { play, normalize } = require('./flames');
const { validateName } = require('../utils/validate');
const { screen, ack } = require('../handlers/screens');
const { botUsername } = require('../handlers/views');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startGame(ctx) {
  await ack(ctx);
  await users.setState(ctx.from.id, 'awaiting_first');
  return screen(ctx, 'play', ui.askFirst(), ui.kb.cancel());
}

function cooldownLeft(user) {
  if (!user.lastGameAt) return 0;
  const left = config.cooldownSeconds * 1000 - (Date.now() - new Date(user.lastGameAt).getTime());
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

async function runGame(ctx, player1, player2) {
  const calc = play(player1, player2);
  const game = { player1, player2, result: calc.result, percent: calc.percent };

  // little loading animation
  let loading = null;
  try {
    loading = await ctx.reply(sc(ui.loadingStages[0]));
    for (const stage of ui.loadingStages.slice(1)) {
      await sleep(550);
      await ctx.telegram.editMessageText(
        loading.chat.id, loading.message_id, undefined, sc(stage)
      );
    }
    await sleep(350);
    await ctx.telegram.deleteMessage(loading.chat.id, loading.message_id);
  } catch (err) {
    logger.warn('Loading animation failed:', err.message);
  }

  try {
    await users.recordGame(ctx.from.id, game);
  } catch (err) {
    logger.error('Could not save game', err); // user still gets their result
  }

  return screen(ctx, `result_${game.result}`, ui.resultCard(game), ui.kb.result(game, botUsername(ctx)));
}

/** handles a plain text message while the user is in a game */
async function handleName(ctx) {
  const user = ctx.dbUser;
  const v = validateName(ctx.message.text);
  if (!v.ok) return ctx.reply(ui.t.nameError(v.code), ui.kb.cancel());

  if (user.state === 'awaiting_first') {
    const moved = await users.advance(user.telegramId, 'awaiting_first', 'awaiting_second', v.name);
    if (!moved) return undefined;
    return screen(ctx, 'play', ui.askSecond(v.name), ui.kb.cancel());
  }

  // awaiting_second
  if (normalize(user.pendingName) === v.key) return ctx.reply(ui.t.sameName(), ui.kb.cancel());
  const wait = cooldownLeft(user);
  if (wait) return ctx.reply(ui.t.cooldown(wait), ui.kb.cancel());

  const claimed = await users.claimSecondName(user.telegramId); // blocks double-sends
  if (!claimed || !claimed.pendingName) return undefined;
  return runGame(ctx, claimed.pendingName, v.name);
}

module.exports = { startGame, handleName };
