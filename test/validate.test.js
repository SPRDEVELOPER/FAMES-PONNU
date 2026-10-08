const test = require('node:test');
const assert = require('node:assert/strict');
const { validateName } = require('../src/utils/validate');

test('accepts normal names and cleans them', () => {
  const v = validateName('  Surya   Kumar ');
  assert.equal(v.ok, true);
  assert.equal(v.name, 'Surya Kumar');
  assert.equal(v.key, 'suryakumar');
});

test('rejects empty, numeric, symbol-only, too short and too long input', () => {
  assert.equal(validateName('   ').code, 'empty');
  assert.equal(validateName('12345').code, 'numbers_only');
  assert.equal(validateName('!!!').code, 'no_letters');
  assert.equal(validateName('a').code, 'too_short');
  assert.equal(validateName('a'.repeat(31)).code, 'too_long');
  assert.equal(validateName('/start').code, 'command');
  assert.equal(validateName(undefined).code, 'not_text');
});

test('strips emojis and odd symbols from the display name', () => {
  assert.equal(validateName('Priya 💖 <b>').name, 'Priya b');
});
