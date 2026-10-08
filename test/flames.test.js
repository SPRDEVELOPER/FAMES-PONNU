const test = require('node:test');
const assert = require('node:assert/strict');
const { play, normalize, cancelCommon, eliminate, FLAMES } = require('../src/games/flames');

test('normalize: lowercase, strips spaces, digits and symbols', () => {
  assert.equal(normalize(' S.u-r_y!a 123 '), 'surya');
  assert.equal(normalize('PRIYA'), 'priya');
  assert.equal(normalize(null), '');
});

test('same names: everything cancels, count is 0 and result is F', () => {
  const r = play('Surya', 'Surya');
  assert.equal(r.count, 0);
  assert.equal(r.result, 'F');
});

test('known case: Surya + Priya -> 4 unmatched letters -> E', () => {
  const r = play('Surya', 'Priya');
  assert.equal(r.count, 4);
  assert.deepEqual(r.eliminated, ['M', 'L', 'F', 'A', 'S']);
  assert.equal(r.result, 'E');
});

test('names with spaces behave like names without', () => {
  assert.deepEqual(play('Surya Kumar', 'Priya').result, play('SuryaKumar', 'Priya').result);
  assert.equal(play('Surya Kumar', 'Priya').count, play('SuryaKumar', 'Priya').count);
});

test('uppercase / lowercase make no difference', () => {
  assert.deepEqual(play('SURYA', 'priya'), play('surya', 'PRIYA'));
});

test('repeated letters cancel one-for-one: aab vs ab leaves one letter', () => {
  const c = cancelCommon('aab', 'ab');
  assert.equal(c.count, 1);
  assert.deepEqual(c.remainingA, ['a']);
  assert.equal(play('aaa', 'aa').count, 1);
  assert.equal(play('aaa', 'aa').result, 'S'); // count 1 always ends on S
});

test('special characters are ignored', () => {
  assert.deepEqual(play("S.u-r_y!a", "P r i y a'"), play('Surya', 'Priya'));
});

test('no common letters: count is the total length', () => {
  const r = play('abc', 'xyz');
  assert.equal(r.count, 6);
  assert.equal(r.common.length, 0);
  assert.equal(r.result, 'M');
});

test('result is symmetric and deterministic', () => {
  for (let i = 0; i < 5; i++) {
    assert.deepEqual(play('Karthik', 'Divya'), play('Karthik', 'Divya'));
  }
  assert.equal(play('Karthik', 'Divya').result, play('Divya', 'Karthik').result);
  assert.equal(play('Karthik', 'Divya').percent, play('Divya', 'Karthik').percent);
});

test('eliminate() handles edge counts', () => {
  assert.equal(eliminate(0).result, 'F');
  assert.equal(eliminate(1).result, 'S');
  for (let n = 0; n < 200; n++) assert.ok(FLAMES.includes(eliminate(n).result));
});

test('always returns one of F L A M E S with a 0-100 percentage', () => {
  let seed = 42;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const abc = 'abcdefghijklmnopqrstuvwxyz ';
  const word = () =>
    Array.from({ length: 2 + Math.floor(rnd() * 14) }, () => abc[Math.floor(rnd() * abc.length)]).join('') + 'q';
  for (let i = 0; i < 500; i++) {
    const r = play(word(), word());
    assert.ok(FLAMES.includes(r.result));
    assert.ok(r.percent >= 0 && r.percent <= 100);
  }
});

test('names without letters are rejected', () => {
  assert.throws(() => play('1234', 'abc'));
  assert.throws(() => play('abc', '!!!'));
});
