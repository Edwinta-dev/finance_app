// src/inbox/reviewFlow.js
// Pure helpers for the in-app review list of unconfirmed candidates.
import { mergePending, applyTransactionsToAccounts } from './mergePending';

/** Unconfirmed inbox items, newest first. */
export const selectUnconfirmed = (pending) =>
  (pending || []).filter((p) => p && p.status === 'unconfirmed').sort((a, b) => b.ts - a.ts);

const parseAmount = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Applies a user decision to one candidate.
 * - confirm: needs a category and a positive amount (amount-less hints must be given one); the item is
 *   merged through the same path as native inbox items, so the transaction shape and balance effect match.
 * - reject: nothing is logged; the item is acked so it leaves the inbox.
 * Returns `{ ok: true, transactions, accounts, ackIds }` or `{ ok: false, error }`.
 */
export const resolveCandidate = ({ item, decision, transactions, accounts, defaultAccountId }) => {
  if (!item || !item.id) return { ok: false, error: 'Missing item.' };

  if (decision.type === 'reject') {
    return { ok: true, transactions, accounts, ackIds: [item.id] };
  }
  if (decision.type !== 'confirm') return { ok: false, error: 'Unknown decision.' };

  const category = (decision.category || '').trim();
  if (!category) return { ok: false, error: 'Pick a category.' };
  const amount = parseAmount(decision.amount !== undefined && decision.amount !== '' ? decision.amount : item.amount);
  if (amount === null) return { ok: false, error: 'Enter an amount above zero.' };

  const merged = mergePending(
    transactions,
    [{ ...item, amount, category, status: 'confirmed', location: decision.location || item.location }],
    { accounts, defaultAccountId }
  );
  if (merged.ackIds.length === 0) return { ok: false, error: 'Add an account first.' };
  return {
    ok: true,
    transactions: merged.transactions,
    accounts: applyTransactionsToAccounts(accounts, merged.added),
    ackIds: merged.ackIds,
  };
};
