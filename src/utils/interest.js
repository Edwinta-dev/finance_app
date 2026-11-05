// src/utils/interest.js
// Monthly interest catch-up: credits one compounded payout per month elapsed since the account's marker.
const { round2, safeNumber } = require('./validation');

const MAX_MONTHS = 120;

function nextMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1); // JS months are 0-based, so passing m (1-based) is "next month"
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Returns { account, txs, months }. A marker equal to (or after) the current month means nothing is due.
// Accounts with no rate just have their marker moved up, so a rate added later never back-fills.
function catchUpInterest(acc, currentKey) {
  const rate = safeNumber(acc.interestRate);
  const marker = acc.lastInterestCompoundedMonth || currentKey;
  if (!(rate > 0) || marker >= currentKey) {
    return { account: { ...acc, interestRate: rate, lastInterestCompoundedMonth: marker >= currentKey ? marker : currentKey }, txs: [], months: 0 };
  }

  let balance = safeNumber(acc.balance);
  const txs = [];
  let key = marker;
  for (let i = 0; i < MAX_MONTHS && key < currentKey; i++) {
    key = nextMonthKey(key);
    const payout = round2(balance * rate / 100 / 12);
    if (payout >= 0.01) {
      balance = round2(balance + payout);
      txs.push({
        id: `interest-${acc.id}-${key}`,
        accountId: acc.id,
        accountName: acc.name,
        amount: payout,
        category: 'Bank Interest',
        type: 'Inflow Credit',
        date: `${key}-01`,
        note: `Automated Interest Compound (${rate}% P.A.)`
      });
    }
  }
  return {
    account: { ...acc, balance, interestRate: rate, lastInterestCompoundedMonth: currentKey },
    txs: txs.reverse(), // newest first
    months: txs.length
  };
}

module.exports = { nextMonthKey, catchUpInterest };
