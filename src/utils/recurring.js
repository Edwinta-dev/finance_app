// src/utils/recurring.js
// Posts recurring rules that have come due since the app was last opened.
// Occurrence k of a rule is anchorDate + k periods (computed from the anchor, so month-end clamping never drifts).
const { formatDate } = require('./dates');
const { round2 } = require('./validation');

const MAX_CATCH_UP = 400; // safety valve for e.g. a weekly rule on a device unopened for years

function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addMonthsClamped(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

function occurrenceDate(anchorIso, frequency, k) {
  const anchor = parseIso(anchorIso);
  switch (frequency) {
    case 'Weekly': return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7 * k);
    case 'Bi-Weekly': return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 14 * k);
    case 'Annual': return addMonthsClamped(anchor, 12 * k);
    case 'Monthly':
    default: return addMonthsClamped(anchor, k);
  }
}

// ISO dates (strictly after lastAppliedDate, up to and including todayIso) on which the rule is due.
function dueDates(rule, todayIso) {
  if (!rule.anchorDate || !rule.lastAppliedDate) return [];
  const due = [];
  for (let k = 1; k <= MAX_CATCH_UP * 4 && due.length < MAX_CATCH_UP; k++) {
    const iso = formatDate(occurrenceDate(rule.anchorDate, rule.frequency, k));
    if (iso > todayIso) break;
    if (iso > rule.lastAppliedDate) due.push(iso);
  }
  return due;
}

// Pure: returns new accounts / transactions / rules plus counters. Legacy rules (no anchor) are anchored to today
// so they never back-fill. Transaction ids are deterministic, so running this twice cannot double-post.
function applyDueRecurring({ accounts, transactions, recurring, todayIso }) {
  let nextAccounts = accounts;
  const posted = [];
  let skipped = 0;
  const existingIds = new Set(transactions.map(t => t.id));

  const nextRecurring = recurring.map(rule => {
    if (!rule.anchorDate || !rule.lastAppliedDate) {
      return { ...rule, anchorDate: todayIso, lastAppliedDate: todayIso };
    }
    const dates = dueDates(rule, todayIso);
    if (dates.length === 0) return rule;

    const account = nextAccounts.find(a => a.id === rule.accountId);
    if (!account || !(rule.amount > 0)) {
      skipped += dates.length; // rule points at a deleted account; advance so it doesn't retry forever
      return { ...rule, lastAppliedDate: dates[dates.length - 1] };
    }

    let delta = 0;
    dates.forEach(date => {
      const id = `rec-${rule.id}-${date}`;
      if (existingIds.has(id)) return;
      delta += rule.isIncoming ? rule.amount : -rule.amount;
      posted.push({
        id,
        accountId: account.id,
        accountName: account.name,
        amount: rule.amount,
        category: rule.category,
        type: rule.isIncoming ? 'Inflow Credit' : 'Expense',
        date,
        note: `Recurring: ${rule.label}`
      });
    });
    nextAccounts = nextAccounts.map(a => (a.id === account.id ? { ...a, balance: round2(a.balance + delta) } : a));
    return { ...rule, lastAppliedDate: dates[dates.length - 1] };
  });

  posted.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first, matching the rest of the ledger
  return {
    accounts: nextAccounts,
    transactions: [...posted, ...transactions],
    recurring: nextRecurring,
    postedCount: posted.length,
    skippedCount: skipped
  };
}

module.exports = { occurrenceDate, dueDates, applyDueRecurring };
