import { selectUnconfirmed, resolveCandidate } from '../src/inbox/reviewFlow';
import { mergePending } from '../src/inbox/mergePending';

const accounts = [{ id: 'a1', name: 'Main', balance: 100 }];
const TS = new Date(2026, 0, 5, 12).getTime();
const item = (over = {}) => ({
  id: 'c1', amount: 12, direction: 'outflow', category: '', memo: 'Kopitiam',
  source: 'bank_notification', confidence: 0.9, ts: TS, status: 'unconfirmed', ...over,
});
const run = (decision, it = item(), txs = []) =>
  resolveCandidate({ item: it, decision, transactions: txs, accounts, defaultAccountId: 'a1' });

describe('selectUnconfirmed', () => {
  it('keeps only unconfirmed, newest first', () => {
    const list = [item({ id: 'a', ts: 1 }), item({ id: 'b', ts: 3 }), item({ id: 'c', status: 'confirmed' }), item({ id: 'd', ts: 2 })];
    expect(selectUnconfirmed(list).map((i) => i.id)).toEqual(['b', 'd', 'a']);
    expect(selectUnconfirmed(undefined)).toEqual([]);
  });
});

describe('resolveCandidate', () => {
  it('confirm logs one transaction, moves the balance and acks after', () => {
    const r = run({ type: 'confirm', category: 'Food' });
    expect(r.ok).toBe(true);
    expect(r.transactions).toHaveLength(1);
    expect(r.transactions[0]).toMatchObject({ category: 'Food', amount: 12, type: 'Expense', note: 'Kopitiam', date: '2026-01-05' });
    expect(r.accounts[0].balance).toBe(88);
    expect(r.ackIds).toEqual(['c1']);
  });

  it('confirming twice does not double-log', () => {
    const first = run({ type: 'confirm', category: 'Food' });
    const second = run({ type: 'confirm', category: 'Food' }, item(), first.transactions);
    expect(second.transactions).toHaveLength(1);
  });

  it('amount-less hints need a valid amount', () => {
    const hint = item({ amount: 0, source: 'bank_camera' });
    expect(run({ type: 'confirm', category: 'Food' }, hint).ok).toBe(false);
    expect(run({ type: 'confirm', category: 'Food', amount: 'abc' }, hint).ok).toBe(false);
    const ok = run({ type: 'confirm', category: 'Food', amount: '4,5' }, hint);
    expect(ok.ok).toBe(true);
    expect(ok.transactions[0].amount).toBe(4.5);
  });

  it('requires a category', () => {
    expect(run({ type: 'confirm', category: '  ' }).ok).toBe(false);
  });

  it('reject logs nothing and acks', () => {
    const r = run({ type: 'reject' });
    expect(r).toMatchObject({ ok: true, transactions: [], ackIds: ['c1'] });
    expect(r.accounts[0].balance).toBe(100);
  });

  it('fails without an account and rejects unknown decisions', () => {
    const r = resolveCandidate({ item: item(), decision: { type: 'confirm', category: 'Food' }, transactions: [], accounts: [] });
    expect(r.ok).toBe(false);
    expect(run({ type: 'wat' }).ok).toBe(false);
  });
});

describe('mergePending with review statuses', () => {
  it('merges only confirmed items; rejected are acked and dropped; unconfirmed untouched', () => {
    const res = mergePending([], [
      item({ id: 'u' }), item({ id: 'r', status: 'rejected' }), item({ id: 'ok', status: 'confirmed', category: 'Food' }),
    ], { accounts });
    expect(res.transactions.map((t) => t.pendingId)).toEqual(['ok']);
    expect(res.ackIds.sort()).toEqual(['ok', 'r']);
  });
});
