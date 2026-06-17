// src/screens/SummaryScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { theme, screenWidth } from '../styles/theme.js';
import { BudgetGraph } from '../components/BudgetGraph.js';

export function SummaryScreen({ accounts, transactions, recurringTransactions }) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / screenWidth);
    setCurrentPage(pageIndex);
  };

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
      {/* Account Status Summary */}
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
      
      <View style={[theme.card, { paddingHorizontal: 0, paddingBottom: 12 }]}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false} 
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: 0 }}
          style={{ width: screenWidth - 30 }} 
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {/* Card Slide 1: Net Worth Trend Layout */}
          <View style={{ width: screenWidth - 30, paddingHorizontal: 15 }}>
            <Text style={[theme.cardTitle, { marginBottom: 5 }]}>Net Worth Balance Trend</Text>
            <BudgetGraph 
              accounts={accounts} 
              transactions={transactions} 
              recurringTransactions={recurringTransactions} // Injected
              isExpenseType={false} 
            />
          </View>

          {/* Card Slide 2: Expense Volume Layout */}
          <View style={{ width: screenWidth - 30, paddingHorizontal: 15 }}>
            <Text style={[theme.cardTitle, { marginBottom: 5 }]}>Expense Outflow Trend</Text>
            <BudgetGraph 
              accounts={accounts} 
              transactions={transactions} 
              recurringTransactions={recurringTransactions} // Injected
              isExpenseType={true} 
            />
          </View>

          {/* Card Slide 3: Category Allocation Matrix Layout */}
          <View style={{ width: screenWidth - 30, paddingHorizontal: 15 }}>
            <Text style={[theme.cardTitle, { marginBottom: 15 }]}>Spending Shares by Category</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 140 }}>
              <View style={{ width: 110, height: 110, justifyContent: 'center', alignItems: 'center' }}>
                <Svg height="110" width="110" viewBox="0 0 200 200">
                  {renderSvgPiePaths()}
                </Svg>
              </View>
              
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
        </ScrollView>

        <View style={[theme.dotWrapper, { marginTop: 5, marginBottom: 5 }]}>
          <View style={[theme.dot, currentPage === 0 ? theme.activeDot : theme.inactiveDot]} />
          <View style={[theme.dot, currentPage === 1 ? theme.activeDot : theme.inactiveDot]} />
          <View style={[theme.dot, currentPage === 2 ? theme.activeDot : theme.inactiveDot]} />
        </View>

        <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 11, fontStyle: 'italic', marginTop: 2, width: '100%' }}>
          *Projections based on extrapolated current spending.
        </Text>
      </View>
      {/* FIXED UI: Added a clean interior spacer block node to clear raised decks elegantly */}
      <View style={{ height: 16 }} />
    </View>
    
  );
}