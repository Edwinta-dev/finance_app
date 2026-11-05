const test = require('node:test');
const assert = require('node:assert');
const r = require('./recurring');
const { catchUpInterest, nextMonthKey } = require('./interest');

const acct = { id: 'a1', name: 'Main', balance: 1000 };
const rule = (o) => ({ id: 'r1', label: 'Rent', amount: 100, category: 'Utilities', frequency: 'Monthly', accountId: 'a1', isIncoming: false, anchorDate: '2026-01-31', lastAppliedDate: '2026-01-31', ...o });

test('monthly rule anchored on the 31st clamps without drifting', () => {
  const dates = r.dueDates(rule({}), '2026-05-31');
  assert.deepStrictEqual(dates, ['2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
});

test('weekly, bi-weekly and annual cadence', () => {
  assert.deepStrictEqual(r.dueDates(rule({ frequency: 'Weekly', anchorDate: '2026-01-01', lastAppliedDate: '2026-01-01' }), '2026-01-22'), ['2026-01-08', '2026-01-15', '2026-01-22']);
  assert.deepStrictEqual(r.dueDates(rule({ frequency: 'Bi-Weekly', anchorDate: '2026-01-01', lastAppliedDate: '2026-01-01' }), '2026-02-01'), ['2026-01-15', '2026-01-29']);
  assert.deepStrictEqual(r.dueDates(rule({ frequency: 'Annual', anchorDate: '2024-02-29', lastAppliedDate: '2024-02-29' }), '2026-12-31'), ['2025-02-28', '2026-02-28']);
});

test('nothing posts before the first full period', () => {
  assert.deepStrictEqual(r.dueDates(rule({ anchorDate: '2026-11-05', lastAppliedDate: '2026-11-05' }), '2026-12-04'), []);
});

test('catch-up posts every missed period, updates balance and is idempotent', () => {
  const input = { accounts: [acct], transactions: [], recurring: [rule({ anchorDate: '2026-01-15', lastAppliedDate: '2026-01-15' })], todayIso: '2026-04-20' };
  const out = r.applyDueRecurring(input);
  assert.strictEqual(out.postedCount, 3);
  assert.strictEqual(out.accounts[0].balance, 700);
  assert.strictEqual(out.transactions[0].date, '2026-04-15');
  assert.strictEqual(out.transactions[0].type, 'Expense');
  assert.strictEqual(out.recurring[0].lastAppliedDate, '2026-04-15');
  const again = r.applyDueRecurring({ ...input, accounts: out.accounts, transactions: out.transactions, recurring: out.recurring });
  assert.strictEqual(again.postedCount, 0);
  assert.strictEqual(again.accounts[0].balance, 700);
});

test('inflow rules credit the account', () => {
  const out = r.applyDueRecurring({ accounts: [acct], transactions: [], recurring: [rule({ isIncoming: true, category: 'Salary' })], todayIso: '2026-03-31' });
  assert.strictEqual(out.accounts[0].balance, 1200);
  assert.strictEqual(out.transactions[0].type, 'Inflow Credit');
});

test('legacy rules get anchored to today and never back-fill', () => {
  const legacy = { id: 'r2', label: 'Old', amount: 50, frequency: 'Monthly', accountId: 'a1', isIncoming: false };
  const out = r.applyDueRecurring({ accounts: [acct], transactions: [], recurring: [legacy], todayIso: '2026-11-05' });
  assert.strictEqual(out.postedCount, 0);
  assert.strictEqual(out.recurring[0].anchorDate, '2026-11-05');
});

test('rules for deleted accounts are skipped and advanced', () => {
  const out = r.applyDueRecurring({ accounts: [], transactions: [], recurring: [rule({ anchorDate: '2026-01-15', lastAppliedDate: '2026-01-15' })], todayIso: '2026-03-20' });
  assert.strictEqual(out.postedCount, 0);
  assert.strictEqual(out.skippedCount, 2);
  assert.strictEqual(out.recurring[0].lastAppliedDate, '2026-03-15');
});

test('interest: credits every missed month, compounding', () => {
  const { account, txs } = catchUpInterest({ id: 'a1', name: 'Save', balance: 1200, interestRate: 12, lastInterestCompoundedMonth: '2026-08' }, '2026-11');
  assert.strictEqual(txs.length, 3);
  assert.strictEqual(txs[txs.length - 1].date, '2026-09-01');
  assert.strictEqual(txs[txs.length - 1].amount, 12);
  assert.strictEqual(account.balance, 1236.36); // 1200 -> 1212 -> 1224.12 -> 1236.36 (rounded per month)
  assert.strictEqual(account.lastInterestCompoundedMonth, '2026-11');
});

test('interest: same month does nothing; zero rate just moves the marker', () => {
  assert.strictEqual(catchUpInterest({ id: 'a', balance: 100, interestRate: 5, lastInterestCompoundedMonth: '2026-11' }, '2026-11').txs.length, 0);
  const z = catchUpInterest({ id: 'a', balance: 100, interestRate: 0, lastInterestCompoundedMonth: '2025-01' }, '2026-11');
  assert.strictEqual(z.txs.length, 0);
  assert.strictEqual(z.account.lastInterestCompoundedMonth, '2026-11');
});

test('nextMonthKey rolls over years', () => {
  assert.strictEqual(nextMonthKey('2026-12'), '2027-01');
  assert.strictEqual(nextMonthKey('2026-01'), '2026-02');
});
