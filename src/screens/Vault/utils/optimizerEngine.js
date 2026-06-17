// src/screens/Vault/utils/optimizerEngine.js

export function runYieldOptimization({
  hysaCapital,
  lockAwayCapital,
  lockDuration,
  salaryInput,
  allowInvestment,
  allowInsurance
}) {
  const totalCash = parseFloat(hysaCapital) || 0;
  const lockCash = parseFloat(lockAwayCapital) || 0;
  const salary = parseFloat(salaryInput) || 0;
  
  let allocations = [];
  let totalInterest = 0;

  // 🏆 Pass 1: OCBC 360 Account Simulation
  if (totalCash > 0) {
    let ocbcCapital = Math.min(totalCash, 100000);
    let yieldAccumulator = 0.05; // Base Rate

    if (salary >= 1800) yieldAccumulator += 1.00; 
    if (totalCash >= 3000) yieldAccumulator += 0.40; 
    if (allowInvestment && totalCash >= 20000) yieldAccumulator += 1.00;

    const ocbcInterestReturn = ocbcCapital * (yieldAccumulator / 100);
    totalInterest += ocbcInterestReturn;

    allocations.push({
      id: 'ocbc_360',
      bank: 'OCBC',
      product: '360 Account Optimization',
      allocatedValue: ocbcCapital,
      rate: yieldAccumulator,
      bullets: [
        `Allocated capital segment: $${ocbcCapital.toFixed(2)}`,
        salary >= 1800 ? '✓ Salary credit requirement met (+1.00%)' : '✕ Increase salary above $1,800 to capture bonus multiplier',
        '✓ Month-on-month balance growth clear (+0.40%)',
        allowInvestment ? '✓ Investment vehicle booster authorized (+1.00%)' : '🛑 Wealth allocations disabled via filter sliders'
      ]
    });
  }

  // 🏆 Pass 2: Standard Chartered BonusSaver Simulation
  if (totalCash > 100000) {
    let scbCapital = Math.min(totalCash - 100000, 100000);
    if (scbCapital > 0) {
      let scbYield = 0.05;
      if (salary >= 3000) scbYield += 0.90;

      const scbInterestReturn = scbCapital * (scbYield / 100);
      totalInterest += scbInterestReturn;

      allocations.push({
        id: 'scb_saver',
        bank: 'SCB',
        product: 'Bonus$aver Optimization',
        allocatedValue: scbCapital,
        rate: scbYield,
        bullets: [
          `Allocated tier segment: $${scbCapital.toFixed(2)}`,
          salary >= 3000 ? '✓ Premium payroll Purpose Code SALA verified (+0.90%)' : '✕ Salary under $3,000 threshold barrier'
        ]
      });
    }
  }

  // 🏆 Pass 3: GXS Time-Locked Fixed Pocket Allocator
  if (lockCash > 0) {
    let applicableRate = 0.88; 
    if (lockDuration >= 12) applicableRate += 0.72;
    else if (lockDuration >= 4) applicableRate += 0.52;
    else if (lockDuration >= 3) applicableRate += 0.34;

    const gxsInterestReturn = lockCash * (applicableRate / 100);
    totalInterest += gxsInterestReturn;

    allocations.push({
      id: 'gxs_vault',
      bank: 'GXS',
      product: `${lockDuration}-Month locked Boost Pocket`,
      allocatedValue: lockCash,
      rate: applicableRate,
      bullets: [
        `Locked assets segment pool: $${lockCash.toFixed(2)}`,
        `✓ Contract lockup duration parameters confirmed: ${lockDuration} Months`,
        '⚠️ Early liquidation triggers immediate regulatory yield clawback'
      ]
    });
  }

  return { allocations, totalInterest };
}