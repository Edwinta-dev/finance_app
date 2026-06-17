// src/screens/BudgetScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Platform, Keyboard, Animated, Dimensions, Modal, Alert 
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { theme, screenWidth } from '../styles/theme';

export function BudgetScreen({
  outflowCategories, transactions, monthlyBudgets, setMonthlyBudgets,
  envelopeAllocations, setEnvelopeAllocations, onSaveCache, scrollRef
}) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [allocationCardY, setAllocationCardY] = useState(0);
  const [transferCardY, setTransferCardY] = useState(0);

  // Transfer Form Operational States
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFromCat, setTransferFromCat] = useState(outflowCategories[0] || '');
  const [transferToCat, setTransferToCat] = useState(outflowCategories[1] || outflowCategories[0] || '');

  // Active user-selected tracking keys
  const [selectedConfigCat, setSelectedConfigCat] = useState(outflowCategories[0] || '');
  const [typedAllocationAmount, setTypedAllocationAmount] = useState('');
  
  // Local staged states
  const [typedNewBudgetCap, setTypedNewBudgetCap] = useState('');
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

  const [isPickerModalVisible, setIsPickerModalVisible] = useState(false);
  const [pickerTargetType, setPickerTargetType] = useState('from'); 

  // --- LOCKED TIMEBOUND ANCHOR RESOLUTION ---
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  // FIXED: Default unassigned baseline values register cleanly as 0 instead of hardcoded fallbacks
  const activeCurrentMonthBudgetCap = monthlyBudgets[currentMonthKey] || 0;
  const isBudgetLockedForThisMonth = activeCurrentMonthBudgetCap > 0;

  useEffect(() => {
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });
    return () => hideListener.remove();
  }, []);

  const handleGlobalCapFocus = () => {
    setTimeout(() => {
      if (scrollRef?.current) scrollRef.current.scrollTo({ y: 0, animated: true });
    }, 60);
  };

  const handleAllocationFocus = () => {
    setKeyboardOffset(Platform.OS === 'ios' ? 240 : 220);
    setTimeout(() => {
      if (scrollRef?.current) scrollRef.current.scrollTo({ y: allocationCardY - 10, animated: true });
    }, 80);
  };

  const handleTransferFocus = () => {
    setKeyboardOffset(Platform.OS === 'ios' ? 280 : 250);
    setTimeout(() => {
      if (scrollRef?.current) scrollRef.current.scrollTo({ y: transferCardY - 10, animated: true });
    }, 80);
  };

  const triggerPickerOverlay = (targetType) => {
    Keyboard.dismiss();
    setPickerTargetType(targetType);
    setIsPickerModalVisible(true);
  };

  const handleSelectCategoryFromModal = (categoryName) => {
    if (pickerTargetType === 'from') setTransferFromCat(categoryName);
    else setTransferToCat(categoryName);
    setIsPickerModalVisible(false);
  };

  // --- TRIGGER INTERACTIVE LIFE VERIFICATION WINDOW ---
  const handlePreLockValidation = () => {
    const freshCapNum = parseFloat(typedNewBudgetCap);
    if (isNaN(freshCapNum) || freshCapNum <= 0) {
      alert("Please enter a valid positive numeric budget limit.");
      return;
    }
    Keyboard.dismiss();
    setIsConfirmModalVisible(true); // Launch confirmation overlay sheet
  };

  // --- INITIALIZE MONTH ENVELOPE PLAN LOCK ---
  const executeLockMonthlyCeiling = () => {
    const freshCapNum = parseFloat(typedNewBudgetCap);
    const nextBudgetsMap = { ...monthlyBudgets, [currentMonthKey]: freshCapNum };
    setMonthlyBudgets(nextBudgetsMap);
    onSaveCache(nextBudgetsMap, envelopeAllocations);
    setIsConfirmModalVisible(false);
  };

  // --- TIME BOUNDARY & SPENDING CALCULATORS ---
  const currentMonthSpendingMap = useMemo(() => {
    const mapping = {};
    outflowCategories.forEach(c => { mapping[c] = 0; });
    
    transactions.forEach(tx => {
      if (tx.type !== 'Expense') return;
      let txMonth = '';
      if (tx.date.includes('-')) txMonth = tx.date.substring(0, 7);
      else if (tx.date.includes('/')) {
        const parts = tx.date.split('/');
        txMonth = `${parts[2]}-${String(parts[1]).padStart(2, '0')}`;
      }

      if (txMonth === currentMonthKey && mapping[tx.category] !== undefined) {
        mapping[tx.category] += tx.amount;
      }
    });
    return mapping;
  }, [transactions, outflowCategories, currentMonthKey]);

  const totalAllocatedSum = useMemo(() => {
    return outflowCategories.reduce((sum, cat) => sum + (envelopeAllocations[cat] || 0), 0);
  }, [envelopeAllocations, outflowCategories]);

  const executeSaveAllocation = () => {
    if (!selectedConfigCat) return;
    const amountNum = parseFloat(typedAllocationAmount) || 0;
    
    const nextAllocations = { ...envelopeAllocations, [selectedConfigCat]: amountNum };
    setEnvelopeAllocations(nextAllocations);
    onSaveCache(monthlyBudgets, nextAllocations);
    setTypedAllocationAmount('');
    Keyboard.dismiss();
  };

  const executeInterEnvelopeTransfer = () => {
    const amountToMove = parseFloat(transferAmount);
    if (!amountToMove || amountToMove <= 0 || transferFromCat === transferToCat) return;

    const sourceCurrentAllocation = envelopeAllocations[transferFromCat] || 0;
    if (sourceCurrentAllocation < amountToMove) {
      alert(`Insufficient funds! Your ${transferFromCat} envelope only contains $${sourceCurrentAllocation.toFixed(2)}.`);
      return;
    }

    const nextAllocations = {
      ...envelopeAllocations,
      [transferFromCat]: sourceCurrentAllocation - amountToMove,
      [transferToCat]: (envelopeAllocations[transferToCat] || 0) + amountToMove
    };

    setEnvelopeAllocations(nextAllocations);
    onSaveCache(monthlyBudgets, nextAllocations);
    setTransferAmount('');
    Keyboard.dismiss();
  };

  const evaluationChartPoints = useMemo(() => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pastTimelinePoints = [];

    for (let i = -4; i <= -1; i++) {
      let m = today.getMonth() + i;
      let y = today.getFullYear();
      if (m < 0) { m += 12; y -= 1; }
      pastTimelinePoints.push({
        label: monthLabels[m],
        key: `${y}-${String(m + 1).padStart(2, '0')}`
      });
    }

    const aggregationMap = {};
    pastTimelinePoints.forEach(p => { aggregationMap[p.key] = 0; });

    transactions.forEach(tx => {
      if (tx.type !== 'Expense') return;
      let txMonth = '';
      if (tx.date.includes('-')) txMonth = tx.date.substring(0, 7);
      else if (tx.date.includes('/')) {
        const parts = tx.date.split('/');
        txMonth = `${parts[2]}-${String(parts[1]).padStart(2, '0')}`;
      }
      if (aggregationMap[txMonth] !== undefined) {
        aggregationMap[txMonth] += tx.amount;
      }
    });

    return pastTimelinePoints.map(p => {
      // FIXED: Scrubbed out the hardcoded 2000 fallbacks entirely so unconfigured timelines evaluate cleanly as 0
      const pastMonthBudgetCeiling = monthlyBudgets[p.key] || activeCurrentMonthBudgetCap || 0;
      const actualExpenses = aggregationMap[p.key];
      const budgetVarianceDelta = pastMonthBudgetCeiling - actualExpenses;

      return {
        label: p.label,
        variance: budgetVarianceDelta
      };
    });
  }, [transactions, monthlyBudgets, activeCurrentMonthBudgetCap]);

  const graphW = screenWidth - 60;
  const graphH = 170; 
  const zeroLineY = graphH / 2; 
  const colSpacing = graphW / evaluationChartPoints.length;
  const barW = colSpacing - 32;

  const maxVarianceAbsolutePeak = useMemo(() => {
    const peaks = evaluationChartPoints.map(p => Math.abs(p.variance));
    return Math.max(...peaks, 100); // Dynamic bounding scales downward safely to prevent macro scaling distortion
  }, [evaluationChartPoints]);

  const geometricScaleFactor = (zeroLineY - 30) / maxVarianceAbsolutePeak;

  return (
    <View style={{ flex: 1 }}>
      
      {/* CARD 1: GLOBAL CONTROL TRAY */}
      <View style={theme.card}>
        <Text style={theme.cardTitle}>Global Envelope Spending Ceiling</Text>
        
        {isBudgetLockedForThisMonth ? (
          <View style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: 8, padding: 12, marginTop: 4 }}>
            <Text style={[theme.boldText, { color: '#38bdf8', fontSize: 15 }]}>
              Unbreakable June Ceiling Limit: ${activeCurrentMonthBudgetCap.toFixed(0)}
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              Distributed capital allocation: ${totalAllocatedSum.toFixed(0)} / ${activeCurrentMonthBudgetCap.toFixed(0)}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>
              🔒 Locked. In accordance with zero-sum envelope guidelines, this value cannot be inflated.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={[theme.bodyText, { marginBottom: 12, color: '#fb923c', fontSize: 13 }]}>
              ⚠️ Initial setup required. Set your absolute maximum cash ceiling. Once locked, it cannot be expanded mid-month.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {/* FIXED UI: Reduced width boundary dynamically to give the button layout breathing room */}
              <TextInput
                style={[theme.input, { flex: 1, marginBottom: 0, color: '#f8fafc', fontWeight: '700' }]}
                placeholder="Enter Monthly Capital Cap ($)"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={typedNewBudgetCap}
                onChangeText={setTypedNewBudgetCap}
                onFocus={handleGlobalCapFocus}
              />
              {/* FIXED UI: Set hard min-widths to prevent the hazard-orange button text from clipping */}
              <TouchableOpacity 
                style={[theme.primaryButton, { marginTop: 0, minWidth: 95, paddingHorizontal: 12, backgroundColor: '#fb923c' }]} 
                onPress={handlePreLockValidation}
              >
                <Text style={[theme.buttonText, { color: '#0f172a' }]}>Lock Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* CARD 2: REAL-TIME ENVELOPE CONSUMPTION TRACKER */}
      <View style={theme.card}>
        <Text style={theme.cardTitle}>Active Envelopes Gauges</Text>
        {outflowCategories.map(cat => {
          const limit = envelopeAllocations[cat] || 0;
          const spent = currentMonthSpendingMap[cat] || 0;
          const remaining = limit - spent;
          const percentageUsed = limit > 0 ? Math.min(spent / limit, 1.0) : 0;
          const isBusted = remaining < 0;

          return (
            <View key={cat} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[theme.boldText, { fontSize: 14 }]}>{cat}</Text>
                <Text style={[theme.bodyText, { fontSize: 13, color: isBusted ? '#f87171' : '#a7f3d0' }]}>
                  {isBusted ? `Busted by -$${Math.abs(remaining).toFixed(0)}` : `$${remaining.toFixed(0)} Left of $${limit.toFixed(0)}`}
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ 
                  height: '100%', 
                  width: `${(percentageUsed * 100).toFixed(0)}%`, 
                  backgroundColor: isBusted ? '#ef4444' : percentageUsed > 0.85 ? '#f59e0b' : '#10b981',
                  borderRadius: 4
                }} />
              </View>
            </View>
          );
        })}
        {outflowCategories.length === 0 && <Text style={theme.mutedText}>Create spending categories inside the Accounts tab to activate envelopes.</Text>}
      </View>

      {/* CARD 3: ENVELOPE SEEDING CONFIGURATOR */}
      <View style={theme.card} onLayout={e => setAllocationCardY(e.nativeEvent.layout.y)}>
        <Text style={theme.cardTitle}>Fund Category Envelopes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={theme.pillContainer}>
          {outflowCategories.map(cat => (
            <TouchableOpacity key={cat} style={[theme.pill, selectedConfigCat === cat && theme.activePill]} onPress={() => setSelectedConfigCat(cat)}>
              <Text style={[theme.pillText, selectedConfigCat === cat && theme.activePillText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 5, alignItems: 'center' }}>
          <TextInput
            style={[theme.input, { flex: 1, marginBottom: 0 }]}
            placeholder={`Fund ${selectedConfigCat || 'Category'} ($)`}
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={typedAllocationAmount}
            onChangeText={setTypedAllocationAmount}
            onFocus={handleAllocationFocus}
            disabled={!isBudgetLockedForThisMonth}
          />
          <TouchableOpacity 
            style={[theme.primaryButton, { marginTop: 0, minWidth: 95, paddingHorizontal: 12 }, !isBudgetLockedForThisMonth && { backgroundColor: '#475569' }]} 
            onPress={executeSaveAllocation}
            disabled={!isBudgetLockedForThisMonth}
          >
            <Text style={theme.buttonText}>Allocate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CARD 4: INTER-ENVELOPE BUDGET SHIFT MATRIX */}
      <View style={theme.card} onLayout={e => setTransferCardY(e.nativeEvent.layout.y)}>
        <Text style={theme.cardTitle}>Inter-Envelope Fluid Transfer</Text>
        <Text style={[theme.bodyText, { color: '#94a3b8', fontSize: 12, marginBottom: 16 }]}>
          Overspent on a category? Shift money directly from a surplus envelope to avoid breaking your overall spending ceiling.
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
          <View style={{ flex: 1 }}>
            <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 5 }]}>From Envelope:</Text>
            <TouchableOpacity 
              style={[theme.input, { justifyContent: 'center', backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }]} 
              onPress={() => triggerPickerOverlay('from')}
              disabled={!isBudgetLockedForThisMonth}
            >
              <Text style={[theme.boldText, { fontSize: 14, color: '#f87171' }]}>{transferFromCat || 'Select'}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ justifyContent: 'center', paddingTop: 18 }}>
            <Text style={[theme.boldText, { color: '#64748b', fontSize: 16 }]}>➔</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 5 }]}>To Envelope:</Text>
            <TouchableOpacity 
              style={[theme.input, { justifyContent: 'center', backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }]} 
              onPress={() => triggerPickerOverlay('to')}
              disabled={!isBudgetLockedForThisMonth}
            >
              <Text style={[theme.boldText, { fontSize: 14, color: '#4ade80' }]}>{transferToCat || 'Select'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            style={[theme.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Amount to move out"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={transferAmount}
            onChangeText={setTransferAmount}
            onFocus={handleTransferFocus}
            disabled={!isBudgetLockedForThisMonth}
          />
          <TouchableOpacity 
            style={[theme.primaryButton, { marginTop: 0, minWidth: 95, paddingHorizontal: 12, backgroundColor: '#38bdf8' }, !isBudgetLockedForThisMonth && { backgroundColor: '#475569' }]} 
            onPress={executeInterEnvelopeTransfer}
            disabled={!isBudgetLockedForThisMonth}
          >
            <Text style={[theme.buttonText, { color: '#0f172a' }]}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CARD 5: DUAL-DIRECTION COMPLIANCE VARIANCE CHART */}
      <View style={theme.card}>
        <Text style={theme.cardTitle}>Historical Compliance Audit</Text>
        <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, marginBottom: 8 }}>
          Net budget variance chart (Budget Limit - Actual Spending). Columns above the zero-axis line indicate savings; columns dropping below indicate overspending breaches.
        </Text>
        
        <View style={{ alignItems: 'center', marginTop: 15 }}>
          <Svg height={graphH} width={graphW}>
            <Line x1="0" y1={zeroLineY} x2={graphW} y2={zeroLineY} stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3" />

            {evaluationChartPoints.map((pt, index) => {
              const x = (index * colSpacing) + (colSpacing - barW) / 2;
              const barH = Math.abs(pt.variance) * geometricScaleFactor;
              const isGreenSurplus = pt.variance >= 0;
              const y = isGreenSurplus ? (zeroLineY - barH) : zeroLineY;
              const labelY = isGreenSurplus ? (y - 6) : (y + barH + 13);

              return (
                <G key={index}>
                  <SvgText x={x + barW / 2} y={labelY} fill="#cbd5e1" fontSize="9" fontWeight="700" textAnchor="middle">
                    {pt.variance !== 0 ? `${isGreenSurplus ? '+' : '-'}$${Math.abs(Math.round(pt.variance))}` : '$0'}
                  </SvgText>

                  <Rect
                    x={x} y={y} width={barW} height={barH > 0 ? barH : 2}
                    fill={isGreenSurplus ? '#34d399' : '#f87171'} 
                    rx="3"
                  />

                  <SvgText x={x + barW / 2} y={graphH - 4} fill="#64748b" fontSize="11" fontWeight="600" textAnchor="middle">
                    {pt.label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
      </View>

      <View style={{ height: Math.max(keyboardOffset, 25) }} />

      {/* DROPDOWN OVERLAY SELECTOR TRAY */}
      <Modal visible={isPickerModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsPickerModalVisible(false)}>
        <TouchableOpacity style={theme.modalOverlay} activeOpacity={1} onPress={() => setIsPickerModalVisible(false)}>
          <View style={[theme.modalContent, { maxHeight: '60%', width: screenWidth - 20, alignSelf: 'center' }]}>
            <Text style={[theme.cardTitle, { fontSize: 16, marginBottom: 12, textAlign: 'center' }]}>
              {pickerTargetType === 'from' ? 'Select Source Envelope' : 'Select Target Destination'}
            </Text>
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {outflowCategories.map(cat => {
                const currentFundedBalance = envelopeAllocations[cat] || 0;
                const isSelected = pickerTargetType === 'from' ? transferFromCat === cat : transferToCat === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#334155', backgroundColor: isSelected ? '#1e293b' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', borderRadius: 8 }}
                    onPress={() => handleSelectCategoryFromModal(cat)}
                  >
                    <Text style={[theme.boldText, { fontSize: 14, color: isSelected ? '#38bdf8' : '#cbd5e1' }]}>{cat}</Text>
                    <Text style={[theme.bodyText, { fontSize: 13, color: '#64748b' }]}>Allocated: ${currentFundedBalance.toFixed(0)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={{ marginTop: 15, backgroundColor: '#475569', borderRadius: 10, paddingVertical: 12, width: '100%', alignItems: 'center' }} onPress={() => setIsPickerModalVisible(false)}><Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 14 }}>Close</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FIXED UI: HIGH-CONTRAST INTENT CONFIRMATION SHEET OVERLAY */}
      <Modal visible={isConfirmModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsConfirmModalVisible(false)}>
        <View style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <Text style={[theme.cardTitle, { fontSize: 18, color: '#f87171', marginBottom: 10 }]}>⚠️ Strict Commitment Protocol</Text>
            <Text style={[theme.bodyText, { fontSize: 13, color: '#cbd5e1', marginBottom: 12 }]}>
              You are locking in a maximum ceiling of <Text style={{ fontWeight: '800', color: '#fb923c' }}>${parseFloat(typedNewBudgetCap).toFixed(2)}</Text> for this billing cycle.
            </Text>
            <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginBottom: 20 }]}>
              In accordance with cash enveloping methodology guidelines, once locked, this boundary cannot be expanded or altered mid-month to absorb overspent deficits. You will be forced to make priority envelope trade-offs.
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: '#475569', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }} 
                onPress={() => setIsConfirmModalVisible(false)}
              >
                <Text style={{ color: '#cbd5e1', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: '#fb923c', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }} 
                onPress={executeLockMonthlyCeiling}
              >
                <Text style={{ color: '#0f172a', fontWeight: '800' }}>Confirm Lock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}