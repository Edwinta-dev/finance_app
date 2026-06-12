// src/screens/BudgetScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Platform, Keyboard, Animated, Dimensions, Modal // Added core Modal primitive
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { theme, screenWidth } from '../styles/theme.js';

export function BudgetScreen({
  outflowCategories, transactions, monthlyBudgetCap, setMonthlyBudgetCap,
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

  // --- NEW: DROPDOWN OVERLAY SELECTOR STATE SEEDING ---
  const [isPickerModalVisible, setIsPickerModalVisible] = useState(false);
  const [pickerTargetType, setPickerTargetType] = useState('from'); // 'from' or 'to'

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

  // --- OPEN EXTENDED MODAL SELECTOR DRAWER ---
  const triggerPickerOverlay = (targetType) => {
    Keyboard.dismiss();
    setPickerTargetType(targetType);
    setIsPickerModalVisible(true);
  };

  const handleSelectCategoryFromModal = (categoryName) => {
    if (pickerTargetType === 'from') {
      setTransferFromCat(categoryName);
    } else {
      setTransferToCat(categoryName);
    }
    setIsPickerModalVisible(false);
  };

  // --- TIME BOUNDARY & SPENDING CALCULATORS ---
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

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

  // --- CONTROLLER EVENTS ---
  const executeSaveAllocation = () => {
    if (!selectedConfigCat) return;
    const amountNum = parseFloat(typedAllocationAmount) || 0;
    
    const nextAllocations = { ...envelopeAllocations, [selectedConfigCat]: amountNum };
    setEnvelopeAllocations(nextAllocations);
    onSaveCache(monthlyBudgetCap, nextAllocations);
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
    onSaveCache(monthlyBudgetCap, nextAllocations);
    setTransferAmount('');
    Keyboard.dismiss();
    alert(`Successfully shifted $${amountToMove.toFixed(2)} from ${transferFromCat} to ${transferToCat}!`);
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

    return pastTimelinePoints.map(p => ({
      label: p.label,
      actualSpending: aggregationMap[p.key],
      isOverBudget: aggregationMap[p.key] > monthlyBudgetCap
    }));
  }, [transactions, monthlyBudgetCap]);

  const graphW = screenWidth - 60;
  const graphH = 130;
  const colSpacing = graphW / evaluationChartPoints.length;
  const barW = colSpacing - 30;

  return (
    <View style={{ flex: 1 }}>
      
      {/* CARD 1: GLOBAL CONTROL TRAY */}
      <View style={theme.card}>
        <Text style={theme.cardTitle}>Global Envelope Spending Ceiling</Text>
        <Text style={[theme.bodyText, { marginBottom: 12, color: '#94a3b8', fontSize: 13 }]}>
          Configure your targeted maximum expenditure limit. Distributed capital: <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>${totalAllocatedSum.toFixed(0)}</Text> / ${monthlyBudgetCap}
        </Text>
        <TextInput
          style={[theme.input, { fontSize: 16, fontWeight: '700', color: '#f8fafc' }]}
          placeholder="Monthly Ceiling Cap ($)"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={String(monthlyBudgetCap)}
          onChangeText={val => {
            const num = parseFloat(val) || 0;
            setMonthlyBudgetCap(num);
            onSaveCache(num, envelopeAllocations);
          }}
          onFocus={handleGlobalCapFocus}
        />
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
      <View 
        style={theme.card} 
        onLayout={e => setAllocationCardY(e.nativeEvent.layout.y)}
      >
        <Text style={theme.cardTitle}>Fund Category Envelopes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={theme.pillContainer}>
          {outflowCategories.map(cat => (
            <TouchableOpacity key={cat} style={[theme.pill, selectedConfigCat === cat && theme.activePill]} onPress={() => setSelectedConfigCat(cat)}>
              <Text style={[theme.pillText, selectedConfigCat === cat && theme.activePillText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}>
          <TextInput
            style={[theme.input, { flex: 1, marginBottom: 0 }]}
            placeholder={`Fund ${selectedConfigCat || 'Category'} ($)`}
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={typedAllocationAmount}
            onChangeText={setTypedAllocationAmount}
            onFocus={handleAllocationFocus}
          />
          <TouchableOpacity style={[theme.primaryButton, { marginTop: 0 }]} onPress={executeSaveAllocation}>
            <Text style={theme.buttonText}>Allocate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CARD 4: FIXED INTER-ENVELOPE DROPDOWN PICKER MATRIX */}
      <View 
        style={theme.card} 
        onLayout={e => setTransferCardY(e.nativeEvent.layout.y)}
      >
        <Text style={theme.cardTitle}>Inter-Envelope Fluid Transfer</Text>
        <Text style={[theme.bodyText, { color: '#94a3b8', fontSize: 12, marginBottom: 16 }]}>
          Overspent on a category? Shift money directly from a surplus envelope to avoid breaking your overall spending ceiling.
        </Text>
        
        {/* FIXED UI: Two full-width selector fields with caret indicator arrows replace the horizontal scrolling pills */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
          <View style={{ flex: 1 }}>
            <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 5 }]}>From Envelope:</Text>
            <TouchableOpacity 
              style={[theme.input, { justifyContent: 'center', backgroundColor: '#1e293b', borderHorizontalWidth: 1, borderColor: '#334155' }]} 
              onPress={() => triggerPickerOverlay('from')}
            >
              <Text style={[theme.boldText, { fontSize: 14, color: '#f87171' }]}>
                {transferFromCat || 'Select Category'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ justifyContent: 'center', paddingTop: 18 }}>
            <Text style={[theme.boldText, { color: '#64748b', fontSize: 16 }]}>➔</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 5 }]}>To Envelope:</Text>
            <TouchableOpacity 
              style={[theme.input, { justifyContent: 'center', backgroundColor: '#1e293b', borderHorizontalWidth: 1, borderColor: '#334155' }]} 
              onPress={() => triggerPickerOverlay('to')}
            >
              <Text style={[theme.boldText, { fontSize: 14, color: '#4ade80' }]}>
                {transferToCat || 'Select Category'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[theme.input, { flex: 1, marginBottom: 0 }]}
            placeholder={`Amount to move out`}
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={transferAmount}
            onChangeText={setTransferAmount}
            onFocus={handleTransferFocus}
          />
          <TouchableOpacity style={[theme.primaryButton, { marginTop: 0, backgroundColor: '#fb923c' }]} onPress={executeInterEnvelopeTransfer}>
            <Text style={[theme.buttonText, { color: '#0f172a' }]}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CARD 5: HISTORICAL PERFORMANCE EVALUATION GRAPH */}
      <View style={theme.card}>
        <Text style={theme.cardTitle}>Historical Compliance Audit</Text>
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Svg height={graphH} width={graphW}>
            <Line x1="0" y1={graphH - 20} x2={graphW} y2={graphH - 20} stroke="#475569" strokeWidth="1" />
            {evaluationChartPoints.map((pt, index) => {
              const x = (index * colSpacing) + (colSpacing - barW) / 2;
              const maxS = Math.max(...evaluationChartPoints.map(p => p.actualSpending), monthlyBudgetCap, 1);
              const barH = (pt.actualSpending / maxS) * (graphH - 45);
              const y = graphH - 20 - barH;

              return (
                <G key={index}>
                  <SvgText x={x + barW / 2} y={y - 6} fill="#94a3b8" fontSize="9" fontWeight="700" textAnchor="middle">
                    {`$${Math.round(pt.actualSpending)}`}
                  </SvgText>

                  <Rect
                    x={x} y={y} width={barW} height={barH > 0 ? barH : 2}
                    fill={pt.isOverBudget ? '#f87171' : '#34d399'}
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

      <View style={{ height: keyboardOffset }} />

      {/* --- NEW DROPDOWN DRAWER MODAL SHEET SELECTION TRAY --- */}
      <Modal
        visible={isPickerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPickerModalVisible(false)}
      >
        <TouchableOpacity 
          style={theme.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsPickerModalVisible(false)}
        >
          <View style={[theme.modalContent, { maxHeight: '60%', width: screenWidth - 20, alignSelf: 'center' }]}>
            <Text style={[theme.cardTitle, { fontSize: 16, marginBottom: 12, textAlign: 'center' }]}>
              {pickerTargetType === 'from' ? 'Select Source Envelope' : 'Select Target Destination'}
            </Text>
            
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              {outflowCategories.map(cat => {
                const currentFundedBalance = envelopeAllocations[cat] || 0;
                const isSelected = pickerTargetType === 'from' ? transferFromCat === cat : transferToCat === cat;
                
                return (
                  <TouchableOpacity
                    key={cat}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#334155',
                      backgroundColor: isSelected ? '#1e293b' : 'transparent',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      borderRadius: 8
                    }}
                    onPress={() => handleSelectCategoryFromModal(cat)}
                  >
                    <Text style={[theme.boldText, { fontSize: 14, color: isSelected ? '#38bdf8' : '#cbd5e1' }]}>
                      {cat}
                    </Text>
                    <Text style={[theme.bodyText, { fontSize: 13, color: '#64748b' }]}>
                      Allocated: ${currentFundedBalance.toFixed(0)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {outflowCategories.length === 0 && (
                <Text style={[theme.mutedText, { textAlign: 'center', paddingVertical: 20 }]}>
                  No spending categories configured yet.
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={{
                marginTop: 15,
                backgroundColor: '#475569',
                borderRadius: 10,
                paddingVertical: 12,
                width: '100%',
                alignItems: 'center'
              }}
              onPress={() => setIsPickerModalVisible(false)}
            >
              <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}