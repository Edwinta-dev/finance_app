const test = require('node:test');
const assert = require('node:assert');
const b = require('./budget');

const cats = ['Food', 'Transport', 'Health'];

test('legacy flat allocations migrate into the given month', () => {
  assert.deepStrictEqual(b.normalizeAllocations({ Food: 100 }, '2026-11'), { '2026-11': { Food: 100 } });
  assert.deepStrictEqual(b.normalizeAllocations({ '2026-10': { Food: 1 } }, '2026-11'), { '2026-10': { Food: 1 } });
  assert.deepStrictEqual(b.normalizeAllocations({}, '2026-11'), {});
  assert.deepStrictEqual(b.normalizeAllocations(null, '2026-11'), {});
});

test('allocation cannot exceed the ceiling', () => {
  const r = b.planAllocation({ cap: 1000, monthAllocs: { Food: 600 }, categories: cats, category: 'Transport', amount: 500 });
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /\$400\.00 is available/);
});

test('re-funding an envelope replaces (not adds to) its old amount', () => {
  const r = b.planAllocation({ cap: 1000, monthAllocs: { Food: 600 }, categories: cats, category: 'Food', amount: 1000 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.next.Food, 1000);
});

test('exact ceiling is allowed, negatives and no-cap are rejected', () => {
  assert.strictEqual(b.planAllocation({ cap: 100, monthAllocs: {}, categories: cats, category: 'Food', amount: 100 }).ok, true);
  assert.strictEqual(b.planAllocation({ cap: 100, monthAllocs: {}, categories: cats, category: 'Food', amount: -1 }).ok, false);
  assert.strictEqual(b.planAllocation({ cap: 0, monthAllocs: {}, categories: cats, category: 'Food', amount: 1 }).ok, false);
});

test('allocations to deleted categories do not count toward the total', () => {
  assert.strictEqual(b.sumAllocations({ Food: 10, Gone: 999 }, cats), 10);
});

test('transfer preserves the total and validates funds', () => {
  const r = b.planTransfer({ monthAllocs: { Food: 100, Transport: 50 }, from: 'Food', to: 'Transport', amount: 30 });
  assert.deepStrictEqual(r.next, { Food: 70, Transport: 80 });
  assert.strictEqual(b.planTransfer({ monthAllocs: { Food: 10 }, from: 'Food', to: 'Health', amount: 30 }).ok, false);
  assert.strictEqual(b.planTransfer({ monthAllocs: { Food: 10 }, from: 'Food', to: 'Food', amount: 1 }).ok, false);
  assert.strictEqual(b.planTransfer({ monthAllocs: { Food: 10 }, from: 'Food', to: 'Health', amount: NaN }).ok, false);
});
