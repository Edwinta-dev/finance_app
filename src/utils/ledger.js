// src/utils/ledger.js
// Single source of truth for how a transaction moves an account balance.

// Legacy adjustments stored their direction only in the free-text note.
function adjustmentDirection(tx) {
  if (tx.direction === 'up' || tx.direction === 'down') return tx.direction;
  return tx.note && tx.note.includes('Up') ? 'up' : 'down';
}

// Signed effect of a transaction on its account balance.
function signedEffect(tx) {
  const amount = typeof tx.amount === 'number' && Number.isFinite(tx.amount) ? tx.amount : 0;
  if (tx.type === 'Expense') return -amount;
  if (tx.type === 'Inflow Credit') return amount;
  if (tx.type === 'Balance Adjustment') return adjustmentDirection(tx) === 'up' ? amount : -amount;
  return 0;
}

// Backfill `direction` on legacy adjustment rows so later note edits can't flip them.
function migrateAdjustments(txs) {
  return txs.map(t => (t.type === 'Balance Adjustment' && !t.direction ? { ...t, direction: adjustmentDirection(t) } : t));
}

module.exports = { adjustmentDirection, signedEffect, migrateAdjustments };
