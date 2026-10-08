const { normalize } = require('../games/flames');

const MAX_LEN = 30;

/**
 * Validates and sanitises a raw name typed by a user.
 * Returns { ok:true, name, key } or { ok:false, code }.
 */
function validateName(raw) {
  if (typeof raw !== 'string') return { ok: false, code: 'not_text' };

  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return { ok: false, code: 'empty' };
  if (cleaned.startsWith('/')) return { ok: false, code: 'command' };
  if (cleaned.length > MAX_LEN) return { ok: false, code: 'too_long' };

  const key = normalize(cleaned);
  if (key.length === 0) {
    return { ok: false, code: /\d/.test(cleaned) ? 'numbers_only' : 'no_letters' };
  }
  if (key.length < 2) return { ok: false, code: 'too_short' };

  const name = cleaned
    .replace(/[^\p{L}\p{M}\s.'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { ok: true, name, key };
}

module.exports = { validateName, MAX_LEN };
