import { mergePending, applyTransactionsToAccounts, INBOX_ID_PREFIX } from '../src/inbox/mergePending';

const accounts = [
  { id: 'a1', name: 'Main', balance: 100 },
  { id: 'a2', name: 'Savings', balance: 500 },
];
const TS = new Date(2026, 0, 5, 12, 0, 0).getTime();
const item = (over = {}) => ({
  id: 'p1', amount: 12.5, direction: 'outflow', category: 'Food', memo: 'lunch',
  source: 'notification', confidence: 1, ts: TS, status: 'confirmed', ...over,
});
const existingTx = { id: 'old', accountId: 'a1', accountName: 'Main', amount: 3, category: 'Food', type: 'Expense', date: '2026-01-01', note: null };

describe('mergePending', () => {
  it('maps a confirmed item to the existing transaction shape', () => {
    const { transactions, ackIds } = mergePending([existingTx], [item()], { accounts, defaultAccountId: 'a1' });
    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      id: `${INBOX_ID_PREFIX}p1`, accountId: 'a1', accountName: 'Main', amount: 12.5,
      category: 'Food', type: 'Expense', date: '2026-01-05', note: 'lunch',
    });
    expect(transactions[1]).toBe(existingTx);
    expect(ackIds).toEqual(['p1']);
  });

  it('keeps every legacy field on the produced transaction', () => {
    const { added } = mergePending([], [item()], { accounts });
    for (const key of Object.keys(existingTx)) expect(added[0]).toHaveProperty(key);
  });

  it('maps inflows and prefers the item account over the default', () => {
    const { added } = mergePending([], [item({ direction: 'inflow', accountId: 'a2' })], { accounts, defaultAccountId: 'a1' });
    expect(added[0]).toMatchObject({ type: 'Inflow Credit', accountId: 'a2', accountName: 'Savings' });
  });

  it('is idempotent across repeated runs and restarts', () => {
    const opts = { accounts, defaultAccountId: 'a1' };
    const first = mergePending([existingTx], [item()], opts);
    const second = mergePending(first.transactions, [item()], opts);
    expect(second.transactions).toHaveLength(2);
    expect(second.added).toEqual([]);
    expect(second.ackIds).toEqual(['p1']); // still acked so it leaves the inbox
    const afterRestart = mergePending(JSON.parse(JSON.stringify(second.transactions)), [item()], opts);
    expect(afterRestart.transactions).toHaveLength(2);
  });

  it('ignores duplicate ids within one batch', () => {
    const { transactions } = mergePending([], [item(), item()], { accounts });
    expect(transactions).toHaveLength(1);
  });

  it('skips unconfirmed items and does not ack them', () => {
    const { transactions, ackIds } = mergePending([], [item({ status: 'unconfirmed' })], { accounts });
    expect(transactions).toEqual([]);
    expect(ackIds).toEqual([]);
  });

  it('acks rejected items without adding them', () => {
    const { transactions, ackIds } = mergePending([], [item({ status: 'rejected' })], { accounts });
    expect(transactions).toEqual([]);
    expect(ackIds).toEqual(['p1']);
  });

  it('acks only merged ids in a mixed batch', () => {
    const { ackIds } = mergePending([], [item({ id: 'a' }), item({ id: 'b', status: 'unconfirmed' }), item({ id: 'c' })], { accounts });
    expect(ackIds).toEqual(['a', 'c']);
  });

  it('leaves items in the inbox when there is no account or the item is invalid', () => {
    const noAcc = mergePending([], [item()], { accounts: [] });
    expect(noAcc.transactions).toEqual([]);
    expect(noAcc.ackIds).toEqual([]);
    const bad = mergePending([], [item({ amount: 0 }), item({ id: 'n', amount: NaN })], { accounts });
    expect(bad.ackIds).toEqual([]);
  });

  it('tolerates empty inputs', () => {
    expect(mergePending(undefined, undefined)).toEqual({ transactions: [], ackIds: [], added: [] });
  });
});

describe('applyTransactionsToAccounts', () => {
  it('adjusts balances like handleLogTransaction', () => {
    const { added } = mergePending([], [item(), item({ id: 'p2', direction: 'inflow', amount: 50, accountId: 'a2' })], { accounts, defaultAccountId: 'a1' });
    const next = applyTransactionsToAccounts(accounts, added);
    expect(next.find((a) => a.id === 'a1').balance).toBe(87.5);
    expect(next.find((a) => a.id === 'a2').balance).toBe(550);
  });

  it('returns untouched accounts when nothing was added', () => {
    expect(applyTransactionsToAccounts(accounts, [])).toEqual(accounts);
  });
});
