const { Telegraf } = require('telegraf');
const config = require('../config');
const { privateOnly, rateLimit, loadUser, onError } = require('./middleware');
const userCommands = require('../commands/user');
const adminCommands = require('../commands/admin');
const actions = require('../handlers/actions');
const text = require('../handlers/text');
const { sc } = require('../utils/smallcaps');
const logger = require('../utils/logger');

function createBot() {
  const bot = new Telegraf(config.botToken, { handlerTimeout: 60_000 });
  bot.catch(onError);
  bot.use(privateOnly, rateLimit(), loadUser);

  userCommands.register(bot);
  adminCommands.register(bot);
  actions.register(bot);
  text.register(bot);
  return bot;
}

/** command menu shown in Telegram (command names must stay lowercase ASCII) */
async function setupCommands(bot) {
  const userMenu = [
    ['start', 'Main menu'],
    ['flames', 'Play FLAMES'],
    ['result', 'My latest result'],
    ['stats', 'My stats'],
    ['leaderboard', 'Top players'],
    ['help', 'How to play'],
    ['cancel', 'Cancel current game'],
  ].map(([command, d]) => ({ command, description: sc(d) }));

  const adminMenu = [
    ...userMenu,
    ...[
      ['admin', 'Admin dashboard'],
      ['users', 'List users'],
      ['broadcast', 'Message everyone'],
      ['ban', 'Ban a user'],
      ['unban', 'Unban a user'],
    ].map(([command, d]) => ({ command, description: sc(d) })),
  ];

  try {
    await bot.telegram.setMyCommands(userMenu);
    for (const id of config.adminIds) {
      await bot.telegram
        .setMyCommands(adminMenu, { scope: { type: 'chat', chat_id: id } })
        .catch((e) => logger.warn(`Could not set admin menu for ${id}: ${e.message}`));
    }
  } catch (err) {
    logger.warn('setMyCommands failed:', err.message);
  }
}

module.exports = { createBot, setupCommands };
