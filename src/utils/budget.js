// src/utils/budget.js
// Envelope allocations are stored per month: { 'YYYY-MM': { [category]: amount } }.
const { round2 } = require('./validation');

// Legacy storage was a flat { [category]: number } map; fold it into the given month.
function normalizeAllocations(stored, monthKey) {
  if (!stored || typeof stored !== 'object') return {};
  const values = Object.values(stored);
  const isLegacyFlat = values.length > 0 && values.every(v => typeof v === 'number');
  return isLegacyFlat ? { [monthKey]: stored } : stored;
}

function sumAllocations(monthAllocs, categories) {
  return round2(categories.reduce((sum, c) => sum + (monthAllocs[c] || 0), 0));
}

// Sets one envelope. Rejects negative amounts and anything that pushes the total past the locked ceiling.
function planAllocation({ cap, monthAllocs, categories, category, amount }) {
  if (!(cap > 0)) return { ok: false, error: 'Lock a monthly ceiling first.' };
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: 'Enter an amount of zero or more.' };
  const others = round2(sumAllocations(monthAllocs, categories) - (monthAllocs[category] || 0));
  const total = round2(others + amount);
  if (total > cap) {
    const room = Math.max(0, round2(cap - others));
    return { ok: false, error: `That would allocate $${total.toFixed(2)} against a $${cap.toFixed(2)} ceiling. Up to $${room.toFixed(2)} is available for this envelope.` };
  }
  return { ok: true, next: { ...monthAllocs, [category]: amount } };
}

// Moves money between envelopes; the total (and so the ceiling) is unchanged.
function planTransfer({ monthAllocs, from, to, amount }) {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Enter an amount greater than zero.' };
  if (from === to) return { ok: false, error: 'Pick two different envelopes.' };
  const available = monthAllocs[from] || 0;
  if (available < amount) return { ok: false, error: `Insufficient funds! ${from} only contains $${available.toFixed(2)}.` };
  return {
    ok: true,
    next: { ...monthAllocs, [from]: round2(available - amount), [to]: round2((monthAllocs[to] || 0) + amount) }
  };
}

module.exports = { normalizeAllocations, sumAllocations, planAllocation, planTransfer };
