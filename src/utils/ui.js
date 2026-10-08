/**
 * Every message + keyboard of the bot lives here.
 * All visible text goes through sc() → small caps.
 */
const { Markup } = require('telegraf');
const { sc } = require('./smallcaps');
const { RESULTS } = require('../games/results');

const LINE = '━━━━━━━━━━━━━━';
const btn = (label, data) => Markup.button.callback(sc(label), data);
const bar = (p) => '▰'.repeat(Math.round(p / 10)) + '▱'.repeat(10 - Math.round(p / 10));
const medal = (rank) => ['🥇', '🥈', '🥉'][rank - 1] || '🎖';
const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/* ───────────── keyboards ───────────── */

function shareUrl(game, username) {
  const link = `https://t.me/${username}`;
  return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
    shareText(game, username)
  )}`;
}

const kb = {
  main: () =>
    Markup.inlineKeyboard([
      [btn('🔥 PLAY FLAMES', 'play')],
      [btn('📊 MY STATS', 'stats'), btn('🏆 LEADERBOARD', 'lb:0')],
      [btn('ℹ️ HOW TO PLAY', 'help')],
    ]),
  cancel: () => Markup.inlineKeyboard([[btn('❌ CANCEL', 'cancel')]]),
  back: () =>
    Markup.inlineKeyboard([[btn('🔥 PLAY FLAMES', 'play'), btn('🏠 MAIN MENU', 'menu')]]),
  result: (game, username) => {
    const rows = [[btn('🔄 PLAY AGAIN', 'play')]];
    if (username) rows.push([Markup.button.url(sc('📤 SHARE RESULT'), shareUrl(game, username))]);
    rows.push([btn('🏠 MAIN MENU', 'menu')]);
    return Markup.inlineKeyboard(rows);
  },
  leaderboard: (page, pages) => {
    const nav = [];
    if (page > 0) nav.push(btn('◀️ PREV', `lbp:${page - 1}`));
    nav.push(Markup.button.callback(sc(`${page + 1}/${pages}`), 'noop'));
    if (page < pages - 1) nav.push(btn('NEXT ▶️', `lbp:${page + 1}`));
    return Markup.inlineKeyboard([nav, [btn('🔥 PLAY FLAMES', 'play'), btn('🏠 MAIN MENU', 'menu')]]);
  },
  broadcastConfirm: () =>
    Markup.inlineKeyboard([[btn('✅ SEND NOW', 'bc:yes'), btn('❌ CANCEL', 'bc:no')]]),
};

/* ───────────── static screens ───────────── */

const welcome = () =>
  sc(
    [
      '🔥 WELCOME TO FLAMES BOT 🔥', '',
      'Want to know your relationship result? 😏❤️', '',
      'Enter two names and let FLAMES decide!', '',
      '🤝 Friends', '❤️ Lovers', '💕 Affection', '💍 Marriage', '⚔️ Enemies', '👨‍👩‍👧 Siblings', '',
      '👇 Tap below to start!',
    ].join('\n')
  );

const help = () =>
  sc(
    [
      'ℹ️ HOW TO PLAY FLAMES', LINE,
      '1️⃣ Press PLAY FLAMES.',
      '2️⃣ Enter the first name.',
      '3️⃣ Enter the second name.',
      '4️⃣ The bot calculates the common letters.',
      '5️⃣ FLAMES elimination is performed.',
      '6️⃣ Your final relationship result is displayed.', '',
      '📜 COMMANDS', LINE,
      '/start - main menu',
      '/flames - start a new game',
      '/result - your latest result',
      '/stats - your statistics',
      '/leaderboard - top players',
      '/cancel - cancel current game',
      '/help - this page', '',
      '⚠️ This is only a fun entertainment game, not a real relationship prediction.',
    ].join('\n')
  );

const askFirst = () =>
  sc(['👤 ENTER FIRST NAME', LINE, "Type the first person's name 👇", '(letters only · max 30 characters)'].join('\n'));

const askSecond = (first) =>
  sc(['💑 ENTER SECOND NAME', LINE, `👤 First name: ${first}`, "Now type the second person's name 👇"].join('\n'));

const loadingStages = [
  '⏳ Calculating your FLAMES result...',
  '🔥 Calculating...',
  '❤️ Matching names...',
  '💫 Running FLAMES...',
  '✨ Result ready!',
];

/* ───────────── result card & share ───────────── */

function resultCard(game) {
  const r = RESULTS[game.result];
  const quote = r.quotes[game.percent % r.quotes.length];
  return sc(
    [
      r.title, '',
      `👤 Person 1: ${game.player1}`,
      `👤 Person 2: ${game.player2}`, '',
      `💖 Result: ${r.emoji} ${r.label.toUpperCase()}`,
      `🔥 Compatibility: ${game.percent}%`,
      bar(game.percent), '',
      r.divider, `"${quote}"`, r.divider, '',
      '🔥 Play again and test another pair!',
      '⚠️ Just for fun - not a real prediction.',
    ].join('\n')
  );
}

function shareText(game, username) {
  const r = RESULTS[game.result];
  return (
    sc(
      [
        '🔥 FLAMES RESULT 🔥', '',
        `${r.emoji} ${game.player1} + ${game.player2} ${r.emoji}`, '',
        `Result: ${r.label.toUpperCase()} ${r.emoji}`, '',
        'Try your FLAMES result with:',
      ].join('\n')
    ) + `\n@${username}`
  );
}

/* ───────────── stats / leaderboard / admin ───────────── */

function statsCard(user) {
  const total = user.totalGames || 0;
  const res = user.results || {};
  const lines = ['📊 MY STATS', LINE, `🎮 Games Played: ${total}`, ''];
  for (const k of Object.keys(RESULTS)) {
    lines.push(`${RESULTS[k].emoji} ${RESULTS[k].label}: ${res[k] || 0}`);
  }
  lines.push('');
  let top = null;
  for (const k of Object.keys(RESULTS)) if ((res[k] || 0) > (top ? res[top] : 0)) top = k;
  lines.push(top ? `🏆 Most common result: ${RESULTS[top].label.toUpperCase()}` : '🏆 Play a game to see your stats!');
  return sc(lines.join('\n'));
}

function leaderboardCard({ rows, total, page, perPage }) {
  if (!rows.length) return sc(['🏆 FLAMES LEADERBOARD', LINE, 'No games played yet. Be the first! 🔥'].join('\n'));
  const lines = ['🏆 FLAMES LEADERBOARD', LINE];
  rows.forEach((u, i) => {
    const rank = page * perPage + i + 1;
    const name = cut((u.firstName || 'Player').trim() || 'Player', 18);
    lines.push(`${rank}. ${medal(rank)} ${name} - ${u.totalGames} games`);
  });
  lines.push('', `👥 ${total} players`);
  return sc(lines.join('\n'));
}

function dashboard(s) {
  const popular = s.popular ? `${RESULTS[s.popular].emoji} ${RESULTS[s.popular].label.toUpperCase()}` : '-';
  return sc(
    [
      '🛠 ADMIN DASHBOARD', LINE,
      `👥 Total Users: ${s.users}`,
      `🎮 Total Games: ${s.games}`,
      `📈 Games Today: ${s.today}`,
      `🔥 Most Popular Result: ${popular}`,
      `🚫 Banned Users: ${s.banned}`, '',
      '/users [page] - list users',
      '/broadcast <text> - message everyone',
      '/ban <id> - ban a user',
      '/unban <id> - unban a user',
    ].join('\n')
  );
}

/* ───────────── small messages ───────────── */

const nameErrors = {
  empty: "⚠️ The name can't be empty. Try again 👇",
  not_text: '⚠️ Please send the name as text 👇',
  command: '⚠️ That looks like a command. Type a name instead 👇',
  too_long: '⚠️ That name is too long (max 30 characters). Try again 👇',
  numbers_only: '⚠️ Names need letters, numbers alone will not work. Try again 👇',
  no_letters: '⚠️ I could not find any letters in that. Try again 👇',
  too_short: '⚠️ Please enter at least 2 letters. Try again 👇',
};

const t = {
  nameError: (code) => sc(nameErrors[code] || nameErrors.empty),
  sameName: () => sc('🙃 Both names are identical! Enter a different second name 👇'),
  cooldown: (s) => sc(`⏳ Easy there! Please wait ${s}s before the next game.`),
  slowDown: () => sc('🚦 Too many requests - please slow down for a moment.'),
  unavailable: () => sc('🛠 Service is temporarily unavailable. Please try again shortly.'),
  genericError: () => sc('⚠️ Something went wrong. Please try again.'),
  unsupported: () => sc('🤔 I only understand text. Tap below to play!'),
  unknownCommand: () => sc('🤔 Unknown command. Try /help'),
  idleHint: () => sc('👇 Tap PLAY FLAMES to start a game!'),
  nothingToCancel: () => sc('🤷 There is no active game to cancel.'),
  cancelled: () => sc('❌ Game cancelled. Back to the menu 🏠'),
  noResult: () => sc('📭 No results yet. Play your first game!'),
  banned: () => sc('🚫 You are not allowed to use this bot.'),
  adminOnly: () => sc('🚫 Admins only.'),
};

module.exports = {
  kb, t, welcome, help, askFirst, askSecond, loadingStages, resultCard, shareText,
  statsCard, leaderboardCard, dashboard, LINE,
};
