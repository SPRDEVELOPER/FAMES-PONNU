// Converts a-z to Unicode small-caps. (There is no true small-cap "x" in Unicode.)
const MAP = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
  s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};

// @usernames, URLs and /commands must stay plain ASCII to keep working.
const PROTECTED = /(@\w+|https?:\/\/\S+|\/\w+)/g;

function sc(input) {
  return String(input)
    .split(PROTECTED)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : [...part].map((ch) => MAP[ch.toLowerCase()] ?? ch).join('')
    )
    .join('');
}

module.exports = { sc };
