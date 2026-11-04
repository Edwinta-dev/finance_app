// src/inbox/mergePending.js
// Pure helpers that fold items from the native inbox into the AsyncStorage ledger.

import { normalizeLocation } from './location';

export const INBOX_ID_PREFIX = 'inbox-';

export const formatLocalDate = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isValidItem = (item) =>
  item &&
  typeof item.id === 'string' &&
  item.id !== '' &&
  Number.isFinite(item.amount) &&
  item.amount > 0;

/** Maps an inbox item to the existing transaction shape (fields unchanged, extras added). */
export const pendingToTransaction = (item, account) => {
  const location = normalizeLocation(item.location);
  return {
    id: `${INBOX_ID_PREFIX}${item.id}`,
    accountId: account.id,
    accountName: account.name,
    amount: item.amount,
    category: item.category,
    type: item.direction === 'inflow' ? 'Inflow Credit' : 'Expense',
    date: formatLocalDate(item.ts),
    note: item.memo && item.memo.trim() !== '' ? item.memo.trim() : null,
    source: item.source,
    pendingId: item.id,
    ...(location ? { location } : {}),
  };
};

/**
 * Merges confirmed inbox items into `transactions`.
 * - Idempotent: an item whose transaction already exists (by id) is not added again,
 *   but is still returned in `ackIds` so it leaves the inbox.
 * - `unconfirmed` items are left alone (no add, no ack) for the review flow.
 * - `rejected` items are acked and dropped.
 * - Items with no resolvable account stay in the inbox (no add, no ack).
 * Returns `{ transactions, ackIds, added }`; `added` lets callers adjust balances.
 */
export const mergePending = (transactions, pending, options = {}) => {
  const accounts = options.accounts || [];
  const fallback = accounts.find((a) => a.id === options.defaultAccountId) || accounts[0];
  const existingIds = new Set((transactions || []).map((t) => t.id));
  const ackIds = [];
  const added = [];
  const seen = new Set();

  for (const item of pending || []) {
    if (!isValidItem(item) || seen.has(item.id)) continue;
    seen.add(item.id);

    if (item.status === 'rejected') {
      ackIds.push(item.id);
      continue;
    }
    if (item.status !== 'confirmed') continue;

    const txId = `${INBOX_ID_PREFIX}${item.id}`;
    if (existingIds.has(txId)) {
      ackIds.push(item.id);
      continue;
    }

    const account = accounts.find((a) => a.id === item.accountId) || fallback;
    if (!account) continue;

    added.push(pendingToTransaction(item, account));
    existingIds.add(txId);
    ackIds.push(item.id);
  }

  return { transactions: [...added.slice().reverse(), ...(transactions || [])], ackIds, added };
};

/** Applies the balance effect of newly merged transactions, as handleLogTransaction does. */
export const applyTransactionsToAccounts = (accounts, txs) =>
  accounts.map((acc) => {
    const delta = txs
      .filter((t) => t.accountId === acc.id)
      .reduce((sum, t) => sum + (t.type === 'Inflow Credit' ? t.amount : -t.amount), 0);
    return delta === 0 ? acc : { ...acc, balance: acc.balance + delta };
  });
