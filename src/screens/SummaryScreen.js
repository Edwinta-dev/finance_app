// src/screens/SummaryScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { theme, screenWidth } from '../styles/theme.js';
import { BudgetGraph } from '../components/BudgetGraph.js';

export function SummaryScreen({ accounts, transactions, onDeleteTransaction }) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / screenWidth);
    setCurrentPage(pageIndex);
  };

  // --- COMPACT PIE CHART CALCULATOR ---
  const expenseLogs = transactions.filter(tx => tx.type === 'Expense');
  const totalExpensesSum = expenseLogs.reduce((sum, tx) => sum + tx.amount, 0);

  const categoryTotalsMap = {};
  expenseLogs.forEach(tx => {
    categoryTotalsMap[tx.category] = (categoryTotalsMap[tx.category] || 0) + tx.amount;
  });

  const chartColorPalette = ['#38bdf8', '#a855f7', '#f43f5e', '#fb923c', '#4ade80', '#eab308', '#6366f1', '#ec4899'];
  
  const pieSlices = Object.keys(categoryTotalsMap).map((catName, index) => ({
    category: catName,
    amount: categoryTotalsMap[catName],
    percentage: totalExpensesSum > 0 ? (categoryTotalsMap[catName] / totalExpensesSum) : 0,
    color: chartColorPalette[index % chartColorPalette.length]
  })).sort((a, b) => b.amount - a.amount);

  let accumulatedAngle = 0;
  const renderSvgPiePaths = () => {
    if (totalExpensesSum === 0) {
      return (
        <G>
          <Path d="M 100 30 A 70 70 0 1 1 99.99 30" fill="none" stroke="#334155" strokeWidth="24" />
          <SvgText x="100" y="105" fill="#64748b" textAnchor="middle" fontSize="12" fontWeight="700">No Data</SvgText>
        </G>
      );
    }

    return pieSlices.map((slice, i) => {
      const sliceAngle = slice.percentage * 360;
      const radius = 70;
      const strokeThickness = 24;
      const cx = 100;
      const cy = 100;

      const startRad = (accumulatedAngle - 90) * Math.PI / 180;
      const endRad = (accumulatedAngle + sliceAngle - 90) * Math.PI / 180;
      
      accumulatedAngle += sliceAngle;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      if (slice.percentage >= 0.999) {
        return (
          <Path 
            key={i}
            d={`M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius}`}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeThickness}
          />
        );
      }

      return (
        <Path
          key={i}
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
          fill="none"
          stroke={slice.color}
          strokeWidth={strokeThickness}
        />
      );
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Account Status Portfolios Wrapper */}
      <View style={theme.card}>
        <Text style={theme.cardTitle}>Account Status Summary</Text>
        {accounts.map(acc => (
          <View key={acc.id} style={theme.accountRowItem}>
            <Text style={theme.bodyText}>{acc.name} {acc.isFavorite && '(Favorite)'}</Text>
            <Text style={theme.boldText}>${acc.balance.toFixed(2)}</Text>
          </View>
        ))}
        {accounts.length === 0 && <Text style={theme.mutedText}>No active bank accounts linked.</Text>}
      </View>

      <Text style={theme.sectionHeader}>Financial Analytics</Text>
      
      {/* Horizontal Carousel Frame */}
      <View style={[theme.graphScrollView, { marginBottom: 15 }]}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false} 
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={screenWidth}
          snapToAlignment="center"
        >
          {/* Card Slide 1: Net Worth Trend Layout */}
          <View style={theme.graphCardPage}>
            <View style={[theme.card, { marginHorizontal: 0 }]}>
              <Text style={[theme.cardTitle, { marginBottom: 10 }]}>Net Worth Balance Trend</Text>
              <BudgetGraph accounts={accounts} transactions={transactions} isExpenseType={false} />
            </View>
          </View>

          {/* Card Slide 2: Expense Volume Layout */}
          <View style={theme.graphCardPage}>
            <View style={[theme.card, { marginHorizontal: 0 }]}>
              <Text style={[theme.cardTitle, { marginBottom: 10 }]}>Expense Outflow Trend</Text>
              <BudgetGraph accounts={accounts} transactions={transactions} isExpenseType={true} />
            </View>
          </View>

          {/* Card Slide 3: Category Allocation Matrix Layout */}
          <View style={theme.graphCardPage}>
            <View style={[theme.card, { marginHorizontal: 0 }]}>
              <Text style={[theme.cardTitle, { marginBottom: 10 }]}>Spending Shares by Category</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 140, marginTop: 5 }}>
                {/* Graph component container justified left */}
                <View style={{ width: 120, height: 120, justifyContent: 'center', alignItems: 'center' }}>
                  <Svg height="120" width="120" viewBox="0 0 200 200">
                    {renderSvgPiePaths()}
                  </Svg>
                </View>
                
                {/* Legend container filled flexibly to utilize remaining area right next to graph */}
                <ScrollView style={{ flex: 1, maxHeight: 140, marginLeft: 15 }} showsVerticalScrollIndicator={false}>
                  {pieSlices.map((slice, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: slice.color, marginRight: 6 }} />
                        <Text style={[theme.bodyText, { fontSize: 13 }]} numberOfLines={1}>
                          {slice.category}
                        </Text>
                      </View>
                      <Text style={[theme.boldText, { fontSize: 13, color: '#94a3b8' }]}>
                        {Math.round(slice.percentage * 100)}%
                      </Text>
                    </View>
                  ))}
                  {pieSlices.length === 0 && <Text style={[theme.mutedText, { marginTop: 45, textAlign: 'center' }]}>No recorded expenses.</Text>}
                </ScrollView>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Stationary Pagination Markers */}
        <View style={theme.dotWrapper}>
          <View style={[theme.dot, currentPage === 0 ? theme.activeDot : theme.inactiveDot]} />
          <View style={[theme.dot, currentPage === 1 ? theme.activeDot : theme.inactiveDot]} />
          <View style={[theme.dot, currentPage === 2 ? theme.activeDot : theme.inactiveDot]} />
        </View>
      </View>

      {/* Transaction History Ledger */}
      <Text style={theme.sectionHeader}>Transaction Stream</Text>
      {transactions.map(tx => {
        const isNegativeOutflow = tx.type === 'Expense' || (tx.type === 'Balance Adjustment' && tx.note?.includes('Down'));
        const mathPrefix = isNegativeOutflow ? '-' : '+';
        const conditionalColor = isNegativeOutflow ? '#f87171' : '#4ade80';

        return (
          <View key={tx.id} style={theme.transactionItem}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={theme.boldText}>{tx.category} ({tx.accountName})</Text>
              <Text style={theme.mutedText}>{tx.date} - <Text style={{ fontStyle: 'italic' }}>{tx.type}</Text></Text>
              {tx.note && <Text style={[theme.bodyText, { fontSize: 13, color: '#94a3b8', marginTop: 2 }]}>{tx.note}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
              <Text style={[theme.boldText, { color: conditionalColor, fontSize: 15 }]}>
                {mathPrefix}${tx.amount.toFixed(2)}
              </Text>
              {/* Transaction Deletion Link Trigger */}
              <TouchableOpacity 
                style={{ paddingVertical: 2, paddingHorizontal: 6, backgroundColor: 'rgba(248, 113, 113, 0.1)', borderRadius: 4 }}
                onPress={() => onDeleteTransaction(tx.id)}
              >
                <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '700' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      {transactions.length === 0 && <Text style={theme.centeredMuted}>No historical logs located.</Text>}
    </View>
  );
}