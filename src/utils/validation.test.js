const test = require('node:test');
const assert = require('node:assert');
const v = require('./validation');
const d = require('./dates');

test('parsePositiveMoney rejects junk, zero, negatives', () => {
  for (const bad of ['', '.', '-', 'abc', '1.2.3', '0', '-5', null, undefined, 'Infinity']) {
    assert.strictEqual(v.parsePositiveMoney(bad), null, String(bad));
  }
  assert.strictEqual(v.parsePositiveMoney('12.345'), 12.35);
  assert.strictEqual(v.parsePositiveMoney(' 7 '), 7);
});

test('parseMoney allows negatives and rounds cents', () => {
  assert.strictEqual(v.parseMoney('-3.5'), -3.5);
  assert.strictEqual(v.parseMoney('0.1') + v.parseMoney('0.2'), 0.30000000000000004); // caller must round2 sums
  assert.strictEqual(v.round2(0.1 + 0.2), 0.3);
});

test('parseRate bounds', () => {
  assert.strictEqual(v.parseRate('4.25'), 4.25);
  assert.strictEqual(v.parseRate('101'), null);
  assert.strictEqual(v.parseRate('x'), null);
});

test('parseIsoDate is a strict calendar check', () => {
  assert.strictEqual(v.parseIsoDate('2026-02-28'), '2026-02-28');
  assert.strictEqual(v.parseIsoDate('2026-02-30'), null);
  assert.strictEqual(v.parseIsoDate('2026-4-5'), null);
  assert.strictEqual(v.parseIsoDate('hello'), null);
});

test('getYearMonthStr normalises formats', () => {
  assert.strictEqual(d.getYearMonthStr('2026-4-5'), '2026-04');
  assert.strictEqual(d.getYearMonthStr('05/04/2026'), '2026-04');
  assert.strictEqual(d.getYearMonthStr('junk'), '');
});

test('safeNumber', () => {
  assert.strictEqual(v.safeNumber(NaN), 0);
  assert.strictEqual(v.safeNumber(null, 5), 5);
  assert.strictEqual(v.safeNumber(3), 3);
});
