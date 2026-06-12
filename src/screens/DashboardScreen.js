// src/screens/DashboardScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, TextInput, 
  Keyboard, Platform, Animated, Dimensions 
} from 'react-native';
import { theme } from '../styles/theme.js';

const { width: windowWidth } = Dimensions.get('window');

export function DashboardScreen({ 
  accounts, expenseAmount, setExpenseAmount, expenseCategory, 
  setExpenseCategory, selectedAccountId, setSelectedAccountId, onLogTransaction,
  outflowCategories, inflowCategories, recurringTransactions, onSaveRecurring, onDeleteRecurring, scrollRef 
}) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isIncoming, setIsIncoming] = useState(false); 
  const [transactionDescription, setDescription] = useState(''); 

  // Recurring Form States
  const [recLabel, setRecLabel] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [recFrequency, setRecFrequency] = useState('Monthly');
  const [isRecIncoming, setIsRecIncoming] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false); 

  // Native Animation Engine Drivers
  const cardSlideX = useRef(new Animated.Value(0)).current;      
  const cardGlow = useRef(new Animated.Value(0)).current;        
  const flipAnimValue = useRef(new Animated.Value(0)).current;   

  const activeSectionRef = useRef('oneOff');

  // FIXED Issue 1: Split categories for one-off inputs on direction flip
  const activeOneOffCategories = isIncoming ? inflowCategories : outflowCategories;
  
  // FIXED Issue 1: Split categories for recurring automation plans on direction toggle
  const activeRecurringCategories = isRecIncoming ? inflowCategories : outflowCategories;

  // Sync selection fallbacks to prevent value mismatches during flip animations
  useEffect(() => {
    if (!activeOneOffCategories.includes(expenseCategory)) {
      setExpenseCategory(activeOneOffCategories[0] || '');
    }
  }, [isIncoming, outflowCategories, inflowCategories]);

  useEffect(() => {
    if (!activeRecurringCategories.includes(recCategory)) {
      setRecCategory(activeRecurringCategories[0] || '');
    }
  }, [isRecIncoming, outflowCategories, inflowCategories]);

  useEffect(() => {
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
      setTimeout(() => {
        if (scrollRef?.current) {
          if (activeSectionRef.current === 'oneOff') {
            scrollRef.current.scrollTo({ y: 0, animated: true });
          } else {
            scrollRef.current.scrollTo({ y: Platform.OS === 'ios' ? 280 : 290, animated: true });
          }
        }
      }, Platform.OS === 'android' ? 120 : 40);
    });
    return () => {
      hideListener.remove();
    };
  }, [scrollRef]);

  const handleOneOffFocus = () => {
    activeSectionRef.current = 'oneOff'; 
    setKeyboardOffset(Platform.OS === 'ios' ? 140 : 160);
    setTimeout(() => {
      if (scrollRef?.current) {
        scrollRef.current.scrollTo({ y: 40, animated: true });
      }
    }, 80);
  };

  const handleRecurringLabelFocus = () => {
    activeSectionRef.current = 'recurring'; 
    setKeyboardOffset(Platform.OS === 'ios' ? 300 : 280);
    setTimeout(() => {
      if (scrollRef?.current) {
        scrollRef.current.scrollTo({ y: Platform.OS === 'ios' ? 240 : 260, animated: true });
      }
    }, 80);
  };

  const handleRecurringAmountFocus = () => {
    activeSectionRef.current = 'recurring';
    setKeyboardOffset(Platform.OS === 'ios' ? 300 : 280);
    setTimeout(() => {
      if (scrollRef?.current) {
        scrollRef.current.scrollTo({ y: Platform.OS === 'ios' ? 310 : 330, animated: true });
      }
    }, 80);
  };

  const handleRecurringNotesFocus = () => {
    activeSectionRef.current = 'recurring';
    setKeyboardOffset(Platform.OS === 'ios' ? 300 : 280);
    setTimeout(() => {
      if (scrollRef?.current) {
        scrollRef.current.scrollTo({ y: Platform.OS === 'ios' ? 510 : 530, animated: true });
      }
    }, 80);
  };

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

  const executeLogSubmit = () => {
    if (!expenseAmount || !selectedAccountId) {
      return onLogTransaction(isIncoming, transactionDescription);
    }

    Animated.timing(cardGlow, {
      toValue: 1,
      duration: 500, 
      useNativeDriver: true
    }).start(() => {
      Animated.timing(cardSlideX, {
        toValue: windowWidth,
        duration: 75, 
        useNativeDriver: true
      }).start(() => {
        onLogTransaction(isIncoming, transactionDescription);
        setDescription(''); 
        Keyboard.dismiss();

        cardSlideX.setValue(-windowWidth);

        Animated.parallel([
          Animated.timing(cardSlideX, {
            toValue: 0,
            duration: 380, 
            useNativeDriver: true
          }),
          Animated.timing(cardGlow, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true
          })
        ]).start();
      });
    });
  };

  const executeRecurringSubmit = () => {
    if (!recLabel || !recAmount) {
      alert('Please fill out Name and Amount for the recurring log.');
      return;
    }
    onSaveRecurring({
      label: recLabel,
      amount: parseFloat(recAmount),
      category: recCategory || activeRecurringCategories[0],
      description: recDescription,
      frequency: recFrequency,
      isIncoming: isRecIncoming
    });
    setRecLabel('');
    setRecAmount('');
    setRecDescription('');
    Keyboard.dismiss();
  };

  const inputScaleHighlight = cardGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02]
  });

  const targetNeonColor = isIncoming ? '#4ade80' : '#f87171';

  return (
    <View style={{ flex: 1 }}>
      {/* Primary Quick Log Card View */}
      <Animated.View style={[
        theme.card, 
        isIncoming ? theme.cardInflow : theme.cardOutflow,
        { transform: [{ perspective: 1000 }, { rotateY: rotatedYTransform }, { translateX: cardSlideX }], position: 'relative' }
      ]}>
        
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 20, backgroundColor: targetNeonColor, opacity: cardGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }), transform: [{ scale: cardGlow.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.04] }) }], zIndex: 9 }} />
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 18, borderWidth: 7, borderColor: targetNeonColor, opacity: cardGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }), zIndex: 10 }} />
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 16, borderWidth: 3.5, borderColor: targetNeonColor, opacity: cardGlow, shadowColor: targetNeonColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.95, shadowRadius: 20, zIndex: 11 }} />

        <View style={{ zIndex: 15 }}>
          <View style={theme.cardHeaderTitleRow}>
            <Text style={theme.cardInlineTitle}>{isIncoming ? 'Log Inflow Transaction' : 'Log Expense Outflow'}</Text>
            <TouchableOpacity style={[theme.directionToggleBtn, isIncoming ? theme.directionToggleInflow : theme.directionToggleOutflow]} onPress={toggleDirectionMode}>
              <Text style={[theme.directionToggleText, { color: isIncoming ? '#4ade80' : '#f87171' }]}>
                {isIncoming ? 'Type: Inflow (+)' : 'Type: Outflow (-)'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[theme.bodyText, { marginBottom: 5 }]}>Funding Source link:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={theme.pillContainer}>
            {accounts.map(acc => (
              <TouchableOpacity key={acc.id} style={[theme.pill, selectedAccountId === acc.id && theme.activePill]} onPress={() => setSelectedAccountId(acc.id)}>
                <Text style={[theme.pillText, selectedAccountId === acc.id && theme.activePillText]}>
                  {acc.name} {acc.isFavorite ? '(Fav)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[theme.bodyText, { marginBottom: 5 }]}>Select Quick Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={theme.pillContainer}>
            {activeOneOffCategories.map(cat => (
              <TouchableOpacity key={cat} style={[theme.pill, expenseCategory === cat && theme.activePill]} onPress={() => setExpenseCategory(cat)}>
                <Text style={[theme.pillText, expenseCategory === cat && theme.activePillText]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Animated.View style={{ transform: [{ scale: inputScaleHighlight }] }}>
            <TextInput style={theme.input} placeholder="Amount ($)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={expenseAmount} onChangeText={setExpenseAmount} onFocus={handleOneOffFocus} />
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: inputScaleHighlight }] }}>
            <TextInput style={theme.input} placeholder="Description (Optional notes)" placeholderTextColor="#94a3b8" value={transactionDescription} onChangeText={setDescription} onFocus={handleOneOffFocus} />
          </Animated.View>

          <TouchableOpacity style={theme.primaryButton} onPress={executeLogSubmit}>
            <Text style={theme.buttonText}>Submit Immediate Transaction</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Automated Ledger Contract Configurator */}
      <View style={theme.card}>
        <Text style={theme.cardTitle}>Provision Automated Recurring Plan</Text>
        
        <View style={theme.cardHeaderTitleRow}>
          <Text style={theme.bodyText}>Flow direction rule:</Text>
          <TouchableOpacity style={[theme.directionToggleBtn, isRecIncoming ? theme.directionToggleInflow : theme.directionToggleOutflow]} onPress={() => setIsRecIncoming(!isRecIncoming)}>
            <Text style={[theme.directionToggleText, { color: isRecIncoming ? '#4ade80' : '#f87171' }]}>
              {isRecIncoming ? 'Incoming Cash' : 'Outgoing Cost'}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput style={theme.input} placeholder="Label (e.g., Salary, Netflix)" placeholderTextColor="#94a3b8" value={recLabel} onChangeText={setRecLabel} onFocus={handleRecurringLabelFocus} />
        <TextInput style={theme.input} placeholder="Amount ($)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={recAmount} onChangeText={setRecAmount} onFocus={handleRecurringAmountFocus} />
        
        <Text style={[theme.bodyText, { marginBottom: 5 }]}>Category allocation:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={theme.pillContainer}>
          {activeRecurringCategories.map(cat => (
            <TouchableOpacity key={cat} style={[theme.pill, recCategory === cat && theme.activePill]} onPress={() => setRecCategory(cat)}>
              <Text style={[theme.pillText, recCategory === cat && theme.activePillText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[theme.bodyText, { marginBottom: 5 }]}>Trigger Frequency Interval:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={theme.pillContainer}>
          {['Weekly', 'Monthly', 'Bi-Weekly', 'Annual'].map(freq => (
            <TouchableOpacity key={freq} style={[theme.pill, recFrequency === freq && theme.activePill]} onPress={() => setRecFrequency(freq)}>
              <Text style={[theme.pillText, recFrequency === freq && theme.activePillText]}>{freq}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput style={theme.input} placeholder="Notes (Optional context description)" placeholderTextColor="#94a3b8" value={recDescription} onChangeText={setRecDescription} onFocus={handleRecurringNotesFocus} />

        <TouchableOpacity style={[theme.primaryButton, { backgroundColor: '#38bdf8' }]} onPress={executeRecurringSubmit}>
          <Text style={theme.buttonText}>Register Automation Contract</Text>
        </TouchableOpacity>

        <TouchableOpacity style={theme.accordionHeader} onPress={() => { setIsAccordionOpen(!isAccordionOpen); handleRecurringNotesFocus(); }}>
          <Text style={theme.accordionHeaderText}>Review Configured Plans ({recurringTransactions.length})</Text>
          <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>{isAccordionOpen ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>

        {isAccordionOpen && (
          <View style={theme.accordionContentContainer}>
            {recurringTransactions.map(rec => (
              <View key={rec.id} style={theme.recurringRowItem}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[theme.boldText, { fontSize: 14 }]}>{rec.label} ({rec.frequency})</Text>
                  <Text style={theme.mutedText}>Category: {rec.category} | {rec.isIncoming ? 'Inflow' : 'Outflow'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={[theme.boldText, { color: rec.isIncoming ? '#4ade80' : '#f87171' }]}>
                    {rec.isIncoming ? '+' : '-'}${rec.amount.toFixed(2)}
                  </Text>
                  <TouchableOpacity style={{ backgroundColor: '#f87171', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 }} onPress={() => onDeleteRecurring(rec.id)}>
                    <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 11 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {recurringTransactions.length === 0 && <Text style={[theme.mutedText, { textAlign: 'center', marginVertical: 10 }]}>No custom automation schedules detected.</Text>}
          </View>
        )}
      </View>

      <View style={{ height: keyboardOffset }} />
    </View>
  );
}