const test = require('node:test');
const assert = require('node:assert');
const { signedEffect, migrateAdjustments } = require('./ledger');

test('signedEffect by type', () => {
  assert.strictEqual(signedEffect({ type: 'Expense', amount: 5 }), -5);
  assert.strictEqual(signedEffect({ type: 'Inflow Credit', amount: 5 }), 5);
  assert.strictEqual(signedEffect({ type: 'Balance Adjustment', amount: 5, direction: 'up' }), 5);
  assert.strictEqual(signedEffect({ type: 'Balance Adjustment', amount: 5, direction: 'down' }), -5);
  assert.strictEqual(signedEffect({ type: 'Expense', amount: NaN }), -0);
});

test('direction field wins over an edited note', () => {
  assert.strictEqual(signedEffect({ type: 'Balance Adjustment', amount: 5, direction: 'down', note: 'Top Up' }), -5);
});

test('legacy notes migrate once', () => {
  const [a, b] = migrateAdjustments([
    { type: 'Balance Adjustment', amount: 1, note: 'Adjusted Up' },
    { type: 'Balance Adjustment', amount: 1, note: 'Adjusted Down (Deleted)' }
  ]);
  assert.strictEqual(a.direction, 'up');
  assert.strictEqual(b.direction, 'down');
});
