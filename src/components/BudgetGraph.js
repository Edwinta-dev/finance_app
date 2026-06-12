// src/components/BudgetGraph.js
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { screenWidth } from '../styles/theme.js';

function getYearMonthStr(dateStr) {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}`;
  }
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}`; 
    if (parts[2] && parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}`; 
  }
  return '';
}

export function BudgetGraph({ accounts, transactions, recurringTransactions, isExpenseType }) {
  const graphWidth = screenWidth - 60;
  const graphHeight = 180; 
  
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const today = new Date();
  const currentMonthIdx = today.getMonth(); 
  const currentYear = today.getFullYear();

  const timelinePoints = useMemo(() => {
    const points = [];
    for (let i = -3; i <= 2; i++) {
      let targetMonth = currentMonthIdx + i;
      let targetYear = currentYear;
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      } else if (targetMonth > 11) {
        targetMonth -= 12;
        targetYear += 1;
      }
      points.push({
        monthLabel: monthLabels[targetMonth],
        monthKey: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`,
        isFuture: i > 0,
        offset: i
      });
    }
    return points;
  }, [currentMonthIdx, currentYear]);

  const finalGraphDataPoints = useMemo(() => {
    const currentNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    // 1. Bank Interest Yield
    const totalMonthlyInterestYield = accounts.reduce((sum, acc) => {
      const ratePA = acc.interestRate || 0.0;
      return sum + (acc.balance * (ratePA / 100 / 12));
    }, 0);

    // 2. FIXED: Normalize recurring transaction intervals into monthly equivalents
    const totalMonthlyRecurringImpact = (recurringTransactions || []).reduce((sum, rec) => {
      let monthlyNormalizedAmount = rec.amount;
      if (rec.frequency === 'Weekly') monthlyNormalizedAmount = rec.amount * (52 / 12);
      else if (rec.frequency === 'Bi-Weekly') monthlyNormalizedAmount = rec.amount * (26 / 12);
      else if (rec.frequency === 'Annual') monthlyNormalizedAmount = rec.amount / 12;

      return sum + (rec.isIncoming ? monthlyNormalizedAmount : -monthlyNormalizedAmount);
    }, 0);

    // 3. Historical Spending Averages
    const expenseTransactions = transactions.filter(tx => tx.type === 'Expense');
    const totalHistoricalExpenses = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // FIXED: HIGH-PERFORMANCE PRE-AGGREGATION PASS ($O(N)$ Linear Optimization)
    // Flattens the transaction history into a temporary map *once*, avoiding nested loops.
    const monthlyNetDeltaMap = {};
    const monthlyExpenseMap = {};
    
    transactions.forEach(tx => {
      const txKey = getYearMonthStr(tx.date);
      if (!txKey) return;
      
      if (!monthlyNetDeltaMap[txKey]) monthlyNetDeltaMap[txKey] = 0;
      if (!monthlyExpenseMap[txKey]) monthlyExpenseMap[txKey] = 0;

      if (tx.type === 'Expense') {
        monthlyNetDeltaMap[txKey] -= tx.amount;
        monthlyExpenseMap[txKey] += tx.amount;
      } else if (tx.type === 'Inflow Credit') {
        monthlyNetDeltaMap[txKey] += tx.amount;
      } else if (tx.type === 'Balance Adjustment') {
        if (tx.note && tx.note.includes('Up')) monthlyNetDeltaMap[txKey] += tx.amount;
        else monthlyNetDeltaMap[txKey] -= tx.amount;
      }
    });

    const historicalMonthKeys = Object.keys(monthlyNetDeltaMap);
    const uniqueMonthsCount = historicalMonthKeys.length > 0 ? historicalMonthKeys.length : 1;
    const averageMonthlySpending = totalHistoricalExpenses / uniqueMonthsCount;

    return timelinePoints.map(point => {
      let dataValue = 0;

      if (isExpenseType) {
        if (point.offset > 0) {
          dataValue = averageMonthlySpending;
        } else {
          dataValue = monthlyExpenseMap[point.monthKey] || 0;
        }
      } else {
        // --- NET WORTH GRAPH FORWARD/BACKWARD FORECAST ---
        if (point.offset === 0) {
          dataValue = currentNetWorth;
        } else if (point.offset > 0) {
          // FIXED: Integrated yields, average spending, and recurring transaction rules into projections
          const netMonthlyDeltaMultiplier = totalMonthlyInterestYield - averageMonthlySpending + totalMonthlyRecurringImpact;
          dataValue = currentNetWorth + (point.offset * netMonthlyDeltaMultiplier);
        } else {
          // Backward calculation reads directly from pre-computed map keys
          let backtrackedBalanceAdjustment = 0;
          historicalMonthKeys.forEach(key => {
            if (key > point.monthKey) {
              backtrackedBalanceAdjustment -= monthlyNetDeltaMap[key]; // Reverse delta movement safely
            }
          });
          dataValue = currentNetWorth + backtrackedBalanceAdjustment;
        }
      }

      return { ...point, value: dataValue > 0 ? dataValue : 0 };
    });
  }, [accounts, transactions, recurringTransactions, isExpenseType, timelinePoints]);

  const { peakDataValue, minDataValue, valueDeltaRange } = useMemo(() => {
    const peak = Math.max(...finalGraphDataPoints.map(p => p.value), 10);
    const min = Math.min(...finalGraphDataPoints.map(p => p.value), 0);
    return { peakDataValue: peak, minDataValue: min, valueDeltaRange: peak - min };
  }, [finalGraphDataPoints]);

  const spacingOffset = (graphWidth / finalGraphDataPoints.length);
  const barColumnWidth = spacingOffset - 24; 

  return (
    <View style={{ alignItems: 'center', marginVertical: 5 }}>
      <Svg height={graphHeight} width={graphWidth}>
        <Line x1="0" y1={graphHeight - 25} x2={graphWidth} y2={graphHeight - 25} stroke="#334155" strokeWidth="1" />

        {finalGraphDataPoints.map((point, index) => {
          const xCoordinate = (index * spacingOffset) + (spacingOffset - barColumnWidth) / 2;
          const normalizedBarHeight = valueDeltaRange > 0 
            ? ((point.value - minDataValue) / valueDeltaRange) * (graphHeight - 65) 
            : 10;
          
          const yCoordinate = graphHeight - 25 - normalizedBarHeight;
          const targetedOpacity = point.isFuture ? 0.4 : 1.0;
          const conditionalColorFill = isExpenseType ? '#f87171' : '#38bdf8';

          return (
            <G key={index} opacity={targetedOpacity}>
              <SvgText
                x={xCoordinate + barColumnWidth / 2}
                y={yCoordinate - 8}
                fill={point.isFuture ? '#64748b' : '#cbd5e1'}
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                {`$${Math.round(point.value)}`}
              </SvgText>

              <Rect
                x={xCoordinate}
                y={yCoordinate}
                width={barColumnWidth}
                height={normalizedBarHeight > 0 ? normalizedBarHeight : 2}
                fill={conditionalColorFill}
                rx="3"
              />

              <SvgText
                x={xCoordinate + barColumnWidth / 2}
                y={graphHeight - 6}
                fill={point.offset === 0 ? '#38bdf8' : '#64748b'}
                fontSize="11"
                fontWeight={point.offset === 0 ? '700' : '500'}
                textAnchor="middle"
              >
                {point.monthLabel}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}