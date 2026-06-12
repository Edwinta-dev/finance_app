// src/components/BudgetGraph.js
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { theme, screenWidth } from '../styles/theme';

export function BudgetGraph({ accounts, transactions, isExpenseType }) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const current = new Date();
  const currentMonth = current.getMonth();
  const currentYear = current.getFullYear();
  
  // Generate the 5-month timeline window array [Now-2, Now-1, Now, Now+1, Now+2]
  const timeline = [];
  for (let i = -2; i <= 2; i++) {
    const targetDate = new Date(currentYear, currentMonth + i, 1);
    timeline.push({ 
      label: monthNames[targetDate.getMonth()], 
      monthIndex: targetDate.getMonth(),
      year: targetDate.getFullYear(),
      offset: i 
    });
  }

  const chartWidth = screenWidth - 70;
  const containerHeight = 130;
  const totalFinancialResources = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // --- BULLETPROOF RAW INTEGER CALCULATION PIPELINE ---
  const values = timeline.map(t => {
    // RULE 1: Future months strictly evaluate to 0
    if (t.offset > 0) {
      return 0;
    }

    if (isExpenseType) {
      // EXPENSE TRAFFIC CALCULATOR
      return transactions.filter(tx => {
        if (tx.type !== 'Expense') return false;
        
        let txMonth, txYear;
        
        // Safe manual string split to bypass brittle Hermes date engine bugs
        if (tx.date.includes('-')) {
          const parts = tx.date.split('-'); // YYYY-MM-DD standard format
          txYear = parseInt(parts[0], 10);
          txMonth = parseInt(parts[1], 10) - 1; // Align to 0-indexed months
        } else if (tx.date.includes('/')) {
          const parts = tx.date.split('/'); // Backwards compatibility for old M/D/YYYY records
          txMonth = parseInt(parts[0], 10) - 1;
          txYear = parseInt(parts[2], 10);
        } else {
          return false;
        }
        
        return txMonth === t.monthIndex && txYear === t.year;
      }).reduce((sum, tx) => sum + tx.amount, 0);

    } else {
      // NET WORTH CURVE GENERATOR
      // Rule 2: Current month displays live active total sums
      if (t.offset === 0) {
        return totalFinancialResources;
      }

      // Rule 3: Reconstruct past points by reversing chronological adjustments
      let netWorthSnap = totalFinancialResources;

      transactions.forEach(tx => {
        let txMonth, txYear;
        
        if (tx.date.includes('-')) {
          const parts = tx.date.split('-');
          txYear = parseInt(parts[0], 10);
          txMonth = parseInt(parts[1], 10) - 1;
        } else if (tx.date.includes('/')) {
          const parts = tx.date.split('/');
          txMonth = parseInt(parts[0], 10) - 1;
          txYear = parseInt(parts[2], 10);
        } else {
          return;
        }

        // Identify if a transaction occurred AFTER this historical evaluation point closed
        const isExecutedAfterThisMonth = (txYear > t.year) || (txYear === t.year && txMonth > t.monthIndex);
        
        if (isExecutedAfterThisMonth) {
          if (tx.type === 'Expense') {
            netWorthSnap += tx.amount; // Add back spent resources to map history backward
          } else if (tx.type === 'Balance Adjustment') {
            // Reverse manual reconciliation tweaks
            if (tx.note && tx.note.includes("Up")) netWorthSnap -= tx.amount;
            else netWorthSnap += tx.amount;
          }
        }
      });

      return netWorthSnap > 0 ? netWorthSnap : 0;
    }
  });

  // Calculate chart metrics headroom boundaries safely
  const maxVal = Math.max(...values, 100) * 1.15;
  
  const coordinates = values.map((val, i) => {
    const barHeight = (val / maxVal) * containerHeight;
    return {
      x: (chartWidth / 5) * i + (chartWidth / 5) / 2,
      y: containerHeight - barHeight
    };
  });

  const polylinePointsString = coordinates.map(p => `${p.x},${p.y}`).join(' ');
  const strokeColor = isExpenseType ? '#fb923c' : '#4ade80'; 
  const barColor = isExpenseType ? '#f87171' : '#0ea5e9';

  return (
    <View style={{ width: chartWidth }}>
      <View style={{ height: containerHeight, width: chartWidth, position: 'relative' }}>
        {/* Render Bar Metrics */}
        <View style={{ flexDirection: 'row', width: chartWidth, height: containerHeight, position: 'absolute' }}>
          {values.map((val, i) => {
            const barHeight = (val / maxVal) * containerHeight;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <Text style={theme.graphValueLabel}>{val > 0 ? `$${Math.round(val)}` : '$0'}</Text>
                <View style={{ width: 22, height: Math.max(barHeight, 0), backgroundColor: barColor, borderRadius: 4 }} />
              </View>
            );
          })}
        </View>

        {/* Render Connected Mathematical Polyline Overlay */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
          <Svg height={containerHeight} width={chartWidth}>
            <Polyline points={polylinePointsString} fill="none" stroke={strokeColor} strokeWidth="2" />
            {coordinates.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r="4" fill="#1e293b" stroke={strokeColor} strokeWidth="2" />
            ))}
          </Svg>
        </View>
      </View>

      {/* Render X Axis Timestamps */}
      <View style={theme.xAxisRow}>
        {timeline.map((t, i) => (
          <Text key={i} style={[theme.xAxisLabel, t.offset === 0 && (isExpenseType ? { color: '#f87171', fontWeight: '700' } : theme.activeXAxisLabel)]}>
            {t.label}{t.offset === 0 ? '\nNow' : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}