// src/screens/DashboardScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, TextInput, 
  Keyboard, Platform, Animated 
} from 'react-native';
import { theme } from '../styles/theme.js';

export function DashboardScreen({ 
  accounts, expenseAmount, setExpenseAmount, expenseCategory, 
  setExpenseCategory, selectedAccountId, setSelectedAccountId, onLogTransaction,
  categories, recurringTransactions, onSaveRecurring, onDeleteRecurring, scrollRef 
}) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isIncoming, setIsIncoming] = useState(false); 
  const [transactionDescription, setDescription] = useState(''); 

  // Recurring Matrix Form State
  const [recLabel, setRecLabel] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState('Food');
  const [recDescription, setRecDescription] = useState('');
  const [recFrequency, setRecFrequency] = useState('Monthly');
  const [isRecIncoming, setIsRecIncoming] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false); 

  const flipAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, () => {
      setKeyboardOffset(Platform.OS === 'android' ? 320 : 80);
    });
    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleInputFocus = () => {
    setTimeout(() => {
      if (scrollRef?.current) {
        scrollRef.current.scrollToEnd({ animated: true });
      }
    }, 120);
  };

  const toggleDirectionMode = () => {
    const nextDirectionState = !isIncoming;
    Animated.timing(flipAnimValue, {
      toValue: 0.5, 
      duration: 160,
      useNativeDriver: true
    }).start(() => {
      setIsIncoming(nextDirectionState);
      Animated.timing(flipAnimValue, {
        toValue: nextDirectionState ? 1 : 0,
        duration: 160,
        useNativeDriver: true
      }).start();
    });
  };

  const rotatedYTransform = flipAnimValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '180deg']
  });

  const executeLogSubmit = () => {
    onLogTransaction(isIncoming, transactionDescription);
    setDescription(''); 
  };

  const executeRecurringSubmit = () => {
    if (!recLabel || !recAmount) {
      alert('Please fill out Name and Amount for the recurring log.');
      return;
    }
    onSaveRecurring({
      label: recLabel,
      amount: parseFloat(recAmount),
      category: recCategory,
      description: recDescription,
      frequency: recFrequency,
      isIncoming: isRecIncoming
    });
    setRecLabel('');
    setRecAmount('');
    setRecDescription('');
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Primary Interactive Quick Log Transaction Card View */}
      <Animated.View style={[
        theme.card, 
        isIncoming ? theme.cardInflow : theme.cardOutflow,
        { transform: [{ rotateY: rotatedYTransform }] }
      ]}>
        <View style={isIncoming ? { transform: [{ rotateY: '180deg' }] } : null}>
          
          <View style={theme.cardHeaderTitleRow}>
            <Text style={theme.cardInlineTitle}>{isIncoming ? 'Log Inflow Transaction' : 'Log Expense Outflow'}</Text>
            <TouchableOpacity 
              style={[theme.directionToggleBtn, isIncoming ? theme.directionToggleInflow : theme.directionToggleOutflow]} 
              onPress={toggleDirectionMode}
            >
              <Text style={[theme.directionToggleText, { color: isIncoming ? '#4ade80' : '#f87171' }]}>
                {isIncoming ? 'Type: Inflow (+)' : 'Type: Outflow (-)'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[theme.bodyText, { marginBottom: 5 }]}>Funding Source link:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={theme.pillContainer}>
            {accounts.map(acc => (
              <TouchableOpacity 
                key={acc.id} 
                style={[theme.pill, selectedAccountId === acc.id && theme.activePill]}
                onPress={() => setSelectedAccountId(acc.id)}
              >
                <Text style={[theme.pillText, selectedAccountId === acc.id && theme.activePillText]}>
                  {acc.name} {acc.isFavorite ? '(Fav)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[theme.bodyText, { marginBottom: 5 }]}>Select Quick Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={theme.pillContainer}>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[theme.pill, expenseCategory === cat && theme.activePill]}
                onPress={() => setExpenseCategory(cat)}
              >
                <Text style={[theme.pillText, expenseCategory === cat && theme.activePillText]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput 
            style={theme.input} 
            placeholder="Amount ($)" 
            placeholderTextColor="#94a3b8" 
            keyboardType="numeric" 
            value={expenseAmount} 
            onChangeText={setExpenseAmount} 
            onFocus={handleInputFocus} 
          />
          
          <TextInput 
            style={theme.input} 
            placeholder="Description (Optional notes)" 
            placeholderTextColor="#94a3b8" 
            value={transactionDescription} 
            onChangeText={setDescription} 
            onFocus={handleInputFocus} 
          />

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
          <TouchableOpacity 
            style={[theme.directionToggleBtn, isRecIncoming ? theme.directionToggleInflow : theme.directionToggleOutflow]} 
            onPress={() => setIsRecIncoming(!isRecIncoming)}
          >
            <Text style={[theme.directionToggleText, { color: isRecIncoming ? '#4ade80' : '#f87171' }]}>
              {isRecIncoming ? 'Incoming Cash' : 'Outgoing Cost'}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput style={theme.input} placeholder="Label (e.g., Salary, Netflix)" placeholderTextColor="#94a3b8" value={recLabel} onChangeText={setRecLabel} onFocus={handleInputFocus} />
        <TextInput style={theme.input} placeholder="Amount ($)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={recAmount} onChangeText={setRecAmount} onFocus={handleInputFocus} />
        
        <Text style={[theme.bodyText, { marginBottom: 5 }]}>Category allocation:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={theme.pillContainer}>
          {categories.map(cat => (
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

        <TextInput style={theme.input} placeholder="Notes (Optional context description)" placeholderTextColor="#94a3b8" value={recDescription} onChangeText={setRecDescription} onFocus={handleInputFocus} />

        <TouchableOpacity style={[theme.primaryButton, { backgroundColor: '#38bdf8' }]} onPress={executeRecurringSubmit}>
          <Text style={theme.buttonText}>Register Automation Contract</Text>
        </TouchableOpacity>

        <TouchableOpacity style={theme.accordionHeader} onPress={() => setIsAccordionOpen(!isAccordionOpen)}>
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
                  <TouchableOpacity 
                    style={{ backgroundColor: '#f87171', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 }}
                    onPress={() => onDeleteRecurring(rec.id)}
                  >
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