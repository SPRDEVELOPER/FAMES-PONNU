/**
 * Anime-girl artwork loader.
 *
 * For each screen key the bot looks for, in this order:
 *   1. env var   IMG_<KEY>            (public https URL)
 *   2. file      assets/<key>.(jpg|jpeg|png)
 *   3. the same two options for "default"
 * If nothing is found the screen is simply sent as text, so the bot
 * works fine with an empty assets folder.
 *
 * Keys: welcome, play, help, stats, leaderboard,
 *       result_F, result_L, result_A, result_M, result_E, result_S
 */
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', '..', 'assets');
const EXTS = ['jpg', 'jpeg', 'png'];

const fileIds = new Map(); // key -> Telegram file_id (fast re-sends)
const broken = new Set(); // keys that failed to send; skipped afterwards

function findFile(name) {
  for (const ext of EXTS) {
    const p = path.join(ASSETS, `${name}.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function resolve(key) {
  if (broken.has(key)) return null;
  if (fileIds.has(key)) return fileIds.get(key);

  const url = process.env[`IMG_${key.toUpperCase()}`];
  if (url) return url;
  const file = findFile(key);
  if (file) return { source: fs.createReadStream(file) };

  if (key !== 'default') return resolve('default');
  return null;
}

function remember(key, message) {
  const photos = message && message.photo;
  if (photos && photos.length) {
    fileIds.set(key, photos[photos.length - 1].file_id);
  }
}

function forget(key) {
  fileIds.delete(key);
  broken.add(key);
}

module.exports = { resolve, remember, forget };
