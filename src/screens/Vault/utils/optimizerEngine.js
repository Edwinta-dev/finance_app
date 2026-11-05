// src/screens/Vault/utils/optimizerEngine.js
// Hard-coded rate table: these are NOT fetched live and will drift as banks change their terms.
const OCBC_CAP = 100000;
const SCB_CAP = 100000;

function runYieldOptimization({
  hysaCapital,
  lockAwayCapital,
  lockDuration,
  salaryInput,
  allowInvestment
}) {
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : 0; };
  const totalCash = num(hysaCapital);
  const lockCash = num(lockAwayCapital);
  const salary = num(salaryInput);

  const allocations = [];
  let totalInterest = 0;
  let unallocated = 0;

  // Pass 1: OCBC 360 (fills first, up to its cap)
  if (totalCash > 0) {
    const ocbcCapital = Math.min(totalCash, OCBC_CAP);
    const salaryMet = salary >= 1800;
    const growthMet = totalCash >= 3000;
    const investMet = allowInvestment && totalCash >= 20000;

    let rate = 0.05; // base
    if (salaryMet) rate += 1.00;
    if (growthMet) rate += 0.40;
    if (investMet) rate += 1.00;

    totalInterest += ocbcCapital * (rate / 100);

    allocations.push({
      id: 'ocbc_360',
      bank: 'OCBC',
      product: '360 Account Optimization',
      allocatedValue: ocbcCapital,
      rate,
      bullets: [
        `Allocated capital segment: $${ocbcCapital.toFixed(2)}`,
        salaryMet ? '✓ Salary credit requirement met (+1.00%)' : '✕ Increase salary above $1,800 to capture bonus multiplier',
        growthMet ? '✓ Month-on-month balance growth assumed (+0.40%)' : '✕ Balance under $3,000: growth bonus not assumed',
        investMet
          ? '✓ Investment vehicle booster authorized (+1.00%)'
          : (allowInvestment ? '✕ Needs $20,000+ to assume the investment bonus' : '🛑 Wealth allocations disabled via filter')
      ]
    });
  }

  // Pass 2: Standard Chartered BonusSaver (takes the overflow above OCBC's cap)
  if (totalCash > OCBC_CAP) {
    const scbCapital = Math.min(totalCash - OCBC_CAP, SCB_CAP);
    const salaryMet = salary >= 3000;
    const rate = 0.05 + (salaryMet ? 0.90 : 0);
    totalInterest += scbCapital * (rate / 100);

    allocations.push({
      id: 'scb_saver',
      bank: 'SCB',
      product: 'Bonus$aver Optimization',
      allocatedValue: scbCapital,
      rate,
      bullets: [
        `Allocated tier segment: $${scbCapital.toFixed(2)}`,
        salaryMet ? '✓ Premium payroll Purpose Code SALA verified (+0.90%)' : '✕ Salary under $3,000 threshold barrier'
      ]
    });
    unallocated = Math.max(0, totalCash - OCBC_CAP - SCB_CAP);
  }

  // Pass 3: GXS time-locked pocket (a separate pool, not part of the cap-fill above)
  if (lockCash > 0) {
    let rate = 0.88;
    if (lockDuration >= 12) rate += 0.72;
    else if (lockDuration >= 4) rate += 0.52;
    else if (lockDuration >= 3) rate += 0.34;

    totalInterest += lockCash * (rate / 100);

    allocations.push({
      id: 'gxs_vault',
      bank: 'GXS',
      product: `${lockDuration}-Month locked Boost Pocket`,
      allocatedValue: lockCash,
      rate,
      bullets: [
        `Locked assets segment pool: $${lockCash.toFixed(2)}`,
        `✓ Contract lockup duration parameters confirmed: ${lockDuration} Months`,
        '⚠️ Early liquidation may forfeit the bonus interest'
      ]
    });
  }

  return { allocations, totalInterest, unallocated };
}

module.exports = { runYieldOptimization };
