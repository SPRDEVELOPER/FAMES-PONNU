/**
 * Pure FLAMES logic - no Telegram, no database. Fully deterministic.
 */
const crypto = require('crypto');

const FLAMES = ['F', 'L', 'A', 'M', 'E', 'S'];

// compatibility % ranges per result
const RANGES = {
  F: [60, 89],
  L: [75, 99],
  A: [65, 95],
  M: [80, 100],
  E: [10, 45],
  S: [55, 85],
};

/** lowercase + keep letters only (spaces, digits, symbols removed) */
function normalize(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^\p{L}]/gu, '');
}

function tally(chars) {
  const m = new Map();
  for (const c of chars) m.set(c, (m.get(c) || 0) + 1);
  return m;
}

/**
 * Cancels matching letters (each letter cancels one occurrence in the other name).
 * Returns the leftover letters of each name, the cancelled letters and the total count.
 */
function cancelCommon(nameA, nameB) {
  const a = [...normalize(nameA)];
  const b = [...normalize(nameB)];
  const ca = tally(a);
  const cb = tally(b);

  const matches = new Map();
  for (const [c, n] of ca) {
    const m = Math.min(n, cb.get(c) || 0);
    if (m > 0) matches.set(c, m);
  }

  const strip = (arr) => {
    const used = new Map();
    const rest = [];
    for (const c of arr) {
      const u = used.get(c) || 0;
      if (u < (matches.get(c) || 0)) used.set(c, u + 1);
      else rest.push(c);
    }
    return rest;
  };

  const remainingA = strip(a);
  const remainingB = strip(b);
  const common = [];
  for (const [c, n] of matches) for (let i = 0; i < n; i++) common.push(c);

  return {
    remainingA,
    remainingB,
    common,
    count: remainingA.length + remainingB.length,
  };
}

/**
 * Circular elimination. `count` is the number of unmatched letters.
 * count === 0 (identical letters) resolves to "F" - soul twins are friends.
 */
function eliminate(count) {
  const list = [...FLAMES];
  const eliminated = [];
  if (!Number.isInteger(count) || count <= 0) {
    return { result: 'F', eliminated };
  }
  let i = 0;
  while (list.length > 1) {
    i = (i + count - 1) % list.length;
    eliminated.push(list.splice(i, 1)[0]);
    if (i >= list.length) i = 0;
  }
  return { result: list[0], eliminated };
}

/** deterministic, order-independent compatibility percentage */
function compatibility(nameA, nameB, result) {
  const keys = [normalize(nameA), normalize(nameB)].sort().join('|');
  const h = crypto.createHash('sha256').update(keys).digest().readUInt32BE(0);
  const [lo, hi] = RANGES[result];
  return lo + (h % (hi - lo + 1));
}

/** full game: throws if either name has no letters */
function play(nameA, nameB) {
  if (!normalize(nameA) || !normalize(nameB)) {
    throw new Error('Both names must contain at least one letter');
  }
  const { remainingA, remainingB, common, count } = cancelCommon(nameA, nameB);
  const { result, eliminated } = eliminate(count);
  return {
    result,
    count,
    common,
    remainingA,
    remainingB,
    eliminated,
    percent: compatibility(nameA, nameB, result),
  };
}

module.exports = { FLAMES, normalize, cancelCommon, eliminate, compatibility, play };
