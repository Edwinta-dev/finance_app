// src/components/QuickLogModal.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Keyboard, Animated, Dimensions 
} from 'react-native';
import { theme } from '../styles/theme';

const { width: windowWidth, height: screenHeight } = Dimensions.get('window');

export function QuickLogModal({
  visible, setVisible, accounts, outflowCategories, inflowCategories,
  expenseAmount, setExpenseAmount, expenseCategory, setExpenseCategory,
  selectedAccountId, setSelectedAccountId, onLogTransaction, onSaveRecurring
}) {
  const [isIncoming, setIsIncoming] = useState(false);
  const [transactionDescription, setDescription] = useState('');
  
  // Mode Selection: One-Off vs Recurring Plan Contracts (One-off selected by default)
  const [logModeType, setLogModeType] = useState('oneOff'); 
  const [recFrequency, setRecFrequency] = useState('Monthly');

  // Animation drivers
  const cardSlideX = useRef(new Animated.Value(0)).current;
  const cardGlow = useRef(new Animated.Value(0)).current;
  const flipAnimValue = useRef(new Animated.Value(0)).current;

  const activeCategories = isIncoming ? inflowCategories : outflowCategories;

  useEffect(() => {
    if (!activeCategories.includes(expenseCategory)) {
      setExpenseCategory(activeCategories[0] || '');
    }
  }, [isIncoming, outflowCategories, inflowCategories]);

  const toggleDirectionMode = () => {
    const nextDirectionState = !isIncoming;
    Animated.timing(flipAnimValue, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true
    }).start(() => {
      setIsIncoming(nextDirectionState);
      Animated.timing(flipAnimValue, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true
      }).start();
    });
  };

  const rotatedYTransform = flipAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg']
  });

  const handleFormSubmitCommit = () => {
    if (!expenseAmount || !selectedAccountId) {
      alert('Please state a valid input amount and select an active account.');
      return;
    }

    Animated.timing(cardGlow, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start(() => {
      Animated.timing(cardSlideX, {
        toValue: windowWidth,
        duration: 80,
        useNativeDriver: true
      }).start(() => {
        if (logModeType === 'oneOff') {
          onLogTransaction(isIncoming, transactionDescription);
        } else {
          onSaveRecurring({
            label: transactionDescription.trim() || `${expenseCategory} Plan`,
            amount: parseFloat(expenseAmount),
            category: expenseCategory,
            description: 'Automated Account Schedule',
            frequency: recFrequency,
            isIncoming: isIncoming
          });
        }

        setExpenseAmount('');
        setDescription('');
        Keyboard.dismiss();

        cardSlideX.setValue(-windowWidth);
        Animated.parallel([
          Animated.timing(cardSlideX, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(cardGlow, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start();
      });
    });
  };

  const targetNeonColor = isIncoming ? '#4ade80' : '#f87171';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setVisible(false)}
    >
      <TouchableOpacity 
        style={theme.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%', alignItems: 'center' }}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: '100%', maxWidth: windowWidth - 24 }}>
            <Animated.View style={[
              theme.card,
              isIncoming ? theme.cardInflow : theme.cardOutflow,
              { transform: [{ perspective: 1000 }, { rotateY: rotatedYTransform }, { translateX: cardSlideX }], position: 'relative', marginBottom: 0 }
            ]}>
              
              <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 20, backgroundColor: targetNeonColor, opacity: cardGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }), transform: [{ scale: cardGlow.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.04] }) }] }} />
              <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 18, borderWidth: 6, borderColor: targetNeonColor, opacity: cardGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }) }} />

              <View style={theme.cardHeaderTitleRow}>
                <Text style={theme.cardInlineTitle}>Quick Log Workspace</Text>
                <TouchableOpacity 
                  style={[theme.directionToggleBtn, isIncoming ? theme.directionToggleInflow : theme.directionToggleOutflow]} 
                  onPress={toggleDirectionMode}
                >
                  <Text style={[theme.directionToggleText, { color: targetNeonColor }]}>
                    {isIncoming ? 'Flow: Inflow (+)' : 'Flow: Outflow (-)'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: screenHeight * 0.65 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 6 }]}>Entry Scheduling Rule:</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  <TouchableOpacity style={[theme.pill, { flex: 1, alignItems: 'center', marginRight: 0 }, logModeType === 'oneOff' && theme.activePill]} onPress={() => setLogModeType('oneOff')}>
                    <Text style={[theme.pillText, logModeType === 'oneOff' && theme.activePillText]}>One-Off Log</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[theme.pill, { flex: 1, alignItems: 'center', marginRight: 0 }, logModeType === 'recurring' && { backgroundColor: '#38bdf8', borderColor: '#38bdf8' }]} onPress={() => setLogModeType('recurring')}>
                    <Text style={[theme.pillText, logModeType === 'recurring' && { color: '#0f172a', fontWeight: '700' }]}>Recurring Plan</Text>
                  </TouchableOpacity>
                </View>

                {logModeType === 'recurring' && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 6 }]}>Trigger Frequency Interval:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {['Weekly', 'Bi-Weekly', 'Monthly', 'Annual'].map(freq => (
                        <TouchableOpacity key={freq} style={[theme.pill, recFrequency === freq && theme.activePill]} onPress={() => setRecFrequency(freq)}>
                          <Text style={[theme.pillText, recFrequency === freq && theme.activePillText]}>{freq}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 6 }]}>Target Portfolio Source:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {accounts.map(acc => (
                    <TouchableOpacity key={acc.id} style={[theme.pill, selectedAccountId === acc.id && theme.activePill]} onPress={() => setSelectedAccountId(acc.id)}>
                      <Text style={[theme.pillText, selectedAccountId === acc.id && theme.activePillText]}>{acc.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {accounts.length === 0 && <Text style={[theme.mutedText, { color: '#ef4444' }]}>No active financial portfolios linked.</Text>}
                </View>

                <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 6 }]}>Category Assignment Allocation:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {activeCategories.map(cat => (
                    <TouchableOpacity key={cat} style={[theme.pill, expenseCategory === cat && theme.activePill]} onPress={() => setExpenseCategory(cat)}>
                      <Text style={[theme.pillText, expenseCategory === cat && theme.activePillText]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput 
                  style={[theme.input, { marginBottom: 10 }]} 
                  placeholder="Amount ($ Value)" 
                  placeholderTextColor="#64748b" 
                  keyboardType="numeric" 
                  value={expenseAmount} 
                  onChangeText={setExpenseAmount} 
                />
                
                <TextInput 
                  style={[theme.input, { marginBottom: 15 }]} 
                  placeholder="Memo (Optional context description notes)" 
                  placeholderTextColor="#64748b" 
                  value={transactionDescription} 
                  onChangeText={setDescription} 
                />

                <TouchableOpacity 
                  style={[theme.primaryButton, { backgroundColor: targetNeonColor }]} 
                  onPress={handleFormSubmitCommit}
                >
                  <Text style={[theme.buttonText, { color: '#0f172a' }]}>
                    {logModeType === 'oneOff' ? 'Commit Entry Record' : 'Deploy Automation Plan'}
                  </Text>
                </TouchableOpacity>

              </ScrollView>
            </Animated.View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}