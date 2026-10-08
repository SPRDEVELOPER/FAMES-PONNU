const test = require('node:test');
const assert = require('node:assert/strict');
const { sc } = require('../src/utils/smallcaps');

test('converts letters to small caps', () => {
  assert.equal(sc('Flames'), 'ꜰʟᴀᴍᴇꜱ');
  assert.equal(sc('FLAMES'), 'ꜰʟᴀᴍᴇꜱ');
});

test('keeps emojis, digits and punctuation', () => {
  assert.equal(sc('🔥 1 !'), '🔥 1 !');
});

test('keeps @usernames, /commands and URLs untouched', () => {
  assert.equal(sc('hi @Flames_Bot'), 'ʜɪ @Flames_Bot');
  assert.equal(sc('use /start now'), 'ᴜꜱᴇ /start ɴᴏᴡ');
  assert.equal(sc('see https://t.me/Abc ok'), 'ꜱᴇᴇ https://t.me/Abc ᴏᴋ');
});
