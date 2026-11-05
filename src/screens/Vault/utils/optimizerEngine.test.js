const test = require('node:test');
const assert = require('node:assert');
const { runYieldOptimization } = require('./optimizerEngine');

const base = { hysaCapital: '50000', lockAwayCapital: '0', lockDuration: 12, salaryInput: '3500', allowInvestment: true };

test('OCBC rate stacks only the bonuses that are met', () => {
  const r = runYieldOptimization({ ...base });
  assert.strictEqual(r.allocations[0].rate.toFixed(2), '2.45');
  const low = runYieldOptimization({ ...base, hysaCapital: '1000', salaryInput: '0' });
  assert.strictEqual(low.allocations[0].rate, 0.05);
  assert.ok(low.allocations[0].bullets[2].startsWith('✕'), 'growth bullet must not claim a bonus that was not applied');
});

test('investment bonus needs both the toggle and $20k', () => {
  assert.strictEqual(runYieldOptimization({ ...base, allowInvestment: false }).allocations[0].rate.toFixed(2), '1.45');
  assert.strictEqual(runYieldOptimization({ ...base, hysaCapital: '10000' }).allocations[0].rate.toFixed(2), '1.45');
});

test('overflow above $100k goes to SCB and anything past $200k is reported, not dropped silently', () => {
  const r = runYieldOptimization({ ...base, hysaCapital: '250000' });
  assert.deepStrictEqual(r.allocations.map(a => a.id), ['ocbc_360', 'scb_saver']);
  assert.strictEqual(r.unallocated, 50000);
});

test('GXS tiers by lock duration', () => {
  const rate = (m) => runYieldOptimization({ ...base, hysaCapital: '0', lockAwayCapital: '1000', lockDuration: m }).allocations[0].rate;
  assert.strictEqual(rate(1), 0.88);
  assert.strictEqual(rate(3).toFixed(2), '1.22');
  assert.strictEqual(rate(6).toFixed(2), '1.40');
  assert.strictEqual(rate(12).toFixed(2), '1.60');
});

test('garbage input yields no allocations instead of NaN', () => {
  const r = runYieldOptimization({ ...base, hysaCapital: 'abc', lockAwayCapital: '-5' });
  assert.deepStrictEqual(r.allocations, []);
  assert.strictEqual(r.totalInterest, 0);
});
