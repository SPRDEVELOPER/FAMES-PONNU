const User = require('./models/User');
const Game = require('./models/Game');

const KEYS = ['F', 'L', 'A', 'M', 'E', 'S'];

async function upsertUser(from) {
  return User.findOneAndUpdate(
    { telegramId: from.id },
    {
      $set: {
        username: from.username || null,
        firstName: (from.first_name || '').slice(0, 64),
        lastSeenAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

const getUser = (telegramId) => User.findOne({ telegramId }).lean();

const resetState = (telegramId) =>
  User.updateOne({ telegramId }, { $set: { state: 'idle', pendingName: null } });

const setState = (telegramId, state, pendingName = null) =>
  User.updateOne({ telegramId }, { $set: { state, pendingName } });

/** atomic transition - returns true only if the user was really in `from` */
async function advance(telegramId, from, to, pendingName) {
  const r = await User.updateOne(
    { telegramId, state: from },
    { $set: { state: to, pendingName } }
  );
  return r.modifiedCount === 1;
}

/** atomically leave `awaiting_second`; returns the previous doc (with pendingName) or null */
const claimSecondName = (telegramId) =>
  User.findOneAndUpdate(
    { telegramId, state: 'awaiting_second' },
    { $set: { state: 'idle', pendingName: null } },
    { returnDocument: 'before' }
  ).lean();

async function recordGame(telegramId, { player1, player2, result, percent }) {
  const game = await Game.create({ telegramId, player1, player2, result, percent });
  await User.updateOne(
    { telegramId },
    {
      $inc: { totalGames: 1, [`results.${result}`]: 1 },
      $set: { lastGameAt: new Date() },
    }
  );
  return game;
}

const getLatestGame = (telegramId) =>
  Game.findOne({ telegramId }).sort({ createdAt: -1 }).lean();

async function leaderboard(page = 0, perPage = 10) {
  const filter = { totalGames: { $gt: 0 }, banned: false };
  const total = await User.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(0, page), pages - 1);
  const rows = await User.find(filter)
    .sort({ totalGames: -1, createdAt: 1 })
    .skip(safePage * perPage)
    .limit(perPage)
    .select('firstName totalGames')
    .lean();
  return { rows, total, pages, page: safePage, perPage };
}

async function adminStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [users, games, today, banned, popular] = await Promise.all([
    User.countDocuments(),
    Game.countDocuments(),
    Game.countDocuments({ createdAt: { $gte: startOfDay } }),
    User.countDocuments({ banned: true }),
    Game.aggregate([
      { $group: { _id: '$result', n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 1 },
    ]),
  ]);
  return { users, games, today, banned, popular: popular[0] ? popular[0]._id : null };
}

async function listUsers(page = 0, perPage = 15) {
  const total = await User.countDocuments();
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(0, page), pages - 1);
  const rows = await User.find()
    .sort({ createdAt: -1 })
    .skip(safePage * perPage)
    .limit(perPage)
    .select('telegramId firstName username totalGames banned')
    .lean();
  return { rows, total, pages, page: safePage };
}

async function setBanned(telegramId, banned) {
  const r = await User.updateOne({ telegramId }, { $set: { banned } });
  return r.matchedCount === 1;
}

/** async iterator over every non-banned user id (for broadcasts) */
const broadcastCursor = () =>
  User.find({ banned: false }).select('telegramId').lean().cursor();

module.exports = {
  KEYS, upsertUser, getUser, resetState, setState, advance, claimSecondName,
  recordGame, getLatestGame, leaderboard, adminStats, listUsers, setBanned,
  broadcastCursor,
};
