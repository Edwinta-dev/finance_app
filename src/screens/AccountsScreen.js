// src/screens/AccountsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Modal, KeyboardAvoidingView, Platform, Keyboard, Dimensions 
} from 'react-native';
import { theme } from '../styles/theme';

const { width: windowWidth, height: screenHeight } = Dimensions.get('window');

export function AccountsScreen({
  accounts, newAccountName, setNewAccountName, newAccountBalance, setNewAccountBalance,
  onCreateAccount, onSetFavorite, onTriggerReconcile, onDeleteAccount,
  outflowCategories, inflowCategories, onAddOutflowCategory, onDeleteOutflowCategory, onAddInflowCategory, onDeleteInflowCategory,
  onUpdateInterestRate, recurringTransactions, onUpdateRecurring, onDeleteRecurring,
  onHardResetApp, scrollRef 
}) {
  const [isAddAccountModalVisible, setIsAddAccountModalVisible] = useState(false);
  const [typedOutflowName, setTypedOutflowName] = useState('');
  const [typedInflowName, setTypedInflowName] = useState('');

  // INTEREST CONFIG DYNAMIC STATES
  const [isInterestModalVisible, setIsInterestModalVisible] = useState(false);
  const [targetInterestAccountId, setTargetInterestAccountId] = useState(null);
  const [typedInterestRateInput, setTypedInterestRateInput] = useState('');

  // AUTOMATIONS BLUEPRINT CONFIG STATES
  const [isEditRecModalVisible, setIsEditRecModalVisible] = useState(false);
  const [selectedRecId, setSelectedRecId] = useState(null);
  const [recLabel, setRecLabel] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState('');
  const [recFrequency, setRecFrequency] = useState('Monthly');
  const [recAccountId, setRecAccountId] = useState('');
  const [recIsIncoming, setRecIsIncoming] = useState(false);

  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [outflowCardY, setOutflowCardY] = useState(0);
  const [inflowCardY, setInflowCardY] = useState(0);
  const [automationsCardY, setAutomationsCardY] = useState(0);

  useEffect(() => {
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });
    return () => hideListener.remove();
  }, []);

  const handleOutflowInputFocus = () => {
    setKeyboardOffset(Platform.OS === 'ios' ? 70 : 165); 
    setTimeout(() => {
      if (scrollRef?.current) scrollRef.current.scrollTo({ y: outflowCardY - 10, animated: true });
    }, 80);
  };

  const handleInflowInputFocus = () => {
    setKeyboardOffset(Platform.OS === 'ios' ? 150 : 245); 
    setTimeout(() => {
      if (scrollRef?.current) scrollRef.current.scrollTo({ y: inflowCardY - 10, animated: true });
    }, 80);
  };

  const handleAutomationsInputFocus = () => {
    setKeyboardOffset(Platform.OS === 'ios' ? 160 : 250);
    setTimeout(() => {
      if (scrollRef?.current) scrollRef.current.scrollTo({ y: automationsCardY - 10, animated: true });
    }, 80);
  };

  const triggerInterestEditingFlow = (accountId, currentRateValue) => {
    setTargetInterestAccountId(accountId);
    setTypedInterestRateInput(currentRateValue !== undefined ? String(currentRateValue) : '0.0');
    setIsInterestModalVisible(true);
  };

  const executeInterestRateSubmit = () => {
    if (!targetInterestAccountId) return;
    onUpdateInterestRate(targetInterestAccountId, typedInterestRateInput);
    setIsInterestModalVisible(false);
    setTargetInterestAccountId(null);
    setTypedInterestRateInput('');
  };

  const triggerEditRecurringFlow = (item) => {
    setSelectedRecId(item.id);
    setRecLabel(item.label || '');
    setRecAmount(String(item.amount || ''));
    setRecCategory(item.category || '');
    setRecFrequency(item.frequency || 'Monthly');
    setRecAccountId(item.accountId || accounts[0]?.id || '');
    setRecIsIncoming(!!item.isIncoming);
    setIsEditRecModalVisible(true);
  };

  const executeUpdateRecurringSubmit = () => {
    if (!recAmount || isNaN(recAmount) || parseFloat(recAmount) <= 0) {
      alert('Please enter a valid positive numeric amount.');
      return;
    }
    onUpdateRecurring(selectedRecId, {
      label: recLabel.trim() || 'Unnamed Plan',
      amount: parseFloat(recAmount),
      category: recCategory,
      frequency: recFrequency,
      accountId: recAccountId,
      isIncoming: recIsIncoming
    });
    setIsEditRecModalVisible(false);
  };

  const executeDeleteRecurringSubmit = () => {
    onDeleteRecurring(selectedRecId);
    setIsEditRecModalVisible(false);
  };

  const executeAddAccountSubmit = () => {
    if (!newAccountName || !newAccountBalance) return;
    onCreateAccount();
    setIsAddAccountModalVisible(false);
  };

  const executeOutflowCategorySubmit = () => {
    if (!typedOutflowName.trim()) return;
    onAddOutflowCategory(typedOutflowName.trim());
    setTypedOutflowName('');
  };

  const executeInflowCategorySubmit = () => {
    if (!typedInflowName.trim()) return;
    onAddInflowCategory(typedInflowName.trim());
    setTypedInflowName('');
  };

  const activeModalCategories = recIsIncoming ? inflowCategories : outflowCategories;

  return (
    <View style={{ flex: 1 }}>
      
      {/* CARD 1: PORTFOLIO LEDGERS CHANNELS */}
      <View style={theme.card}>
        <View style={theme.cardHeaderTitleRow}>
          <Text style={theme.cardInlineTitle}>Linked Cash Portfolios</Text>
          <TouchableOpacity 
            style={[theme.secondaryButton, { backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }]}
            onPress={() => setIsAddAccountModalVisible(true)}
          >
            <Text style={[theme.secondaryButtonText, { fontSize: 12 }]}>+ New Account</Text>
          </TouchableOpacity>
        </View>

        {accounts.map(acc => {
          const ratePA = acc.interestRate !== undefined ? acc.interestRate : 0.0;
          return (
            <View key={acc.id} style={[theme.accountCard, { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#334155', alignItems: 'center' }]}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={theme.boldText}>{acc.name} {acc.isFavorite && '⭐'}</Text>
                <Text style={[theme.boldText, { color: '#38bdf8', fontSize: 16, marginTop: 2 }]}>
                  ${acc.balance.toFixed(2)}
                </Text>
                <Text style={[theme.mutedText, { color: ratePA > 0 ? '#4ade80' : '#64748b', fontSize: 11, marginTop: 2 }]}>
                  Yield Parameter: {ratePA.toFixed(2)}% P.A.
                </Text>
              </View>

              <View style={[theme.actionRow, { gap: 4, alignItems: 'center' }]}>
                {!acc.isFavorite ? (
                  <TouchableOpacity style={[theme.secondaryButton, { paddingVertical: 5, paddingHorizontal: 7, borderRadius: 6, minWidth: 40, alignItems: 'center' }]} onPress={() => onSetFavorite(acc.id)}>
                    <Text style={[theme.secondaryButtonText, { fontSize: 10, fontWeight: '700' }]}>Fave</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 40 }} />
                )}
                
                <TouchableOpacity style={[theme.secondaryButton, { borderColor: '#4ade80', paddingVertical: 5, paddingHorizontal: 7, borderRadius: 6, minWidth: 46, alignItems: 'center' }]} onPress={() => triggerInterestEditingFlow(acc.id, ratePA)}>
                  <Text style={[theme.secondaryButtonText, { color: '#4ade80', fontSize: 10, fontWeight: '700' }]}>% Rate</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[theme.secondaryButton, { borderColor: '#fb923c', paddingVertical: 5, paddingHorizontal: 7, borderRadius: 6, minWidth: 34, alignItems: 'center' }]} onPress={() => onTriggerReconcile(acc.id)}>
                  <Text style={[theme.secondaryButtonText, { color: '#fb923c', fontSize: 10, fontWeight: '700' }]}>Fix</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[theme.secondaryButton, { borderColor: '#f87171', paddingVertical: 5, paddingHorizontal: 7, borderRadius: 6, minWidth: 34, alignItems: 'center' }]} onPress={() => onDeleteAccount(acc.id)}>
                  <Text style={[theme.secondaryButtonText, { color: '#f87171', fontSize: 10, fontWeight: '700' }]}>Del</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {accounts.length === 0 && <Text style={theme.mutedText}>No active cash accounts found.</Text>}
      </View>

      {/* CARD 2: RECURRING TRANSACTION AUTOMATIONS MANAGEMENT */}
      <View style={theme.card} onLayout={(event) => setAutomationsCardY(event.nativeEvent.layout.y)}>
        <Text style={theme.cardTitle}>Active Automated Schedules</Text>
        {recurringTransactions.map(item => {
          const matchedAccName = accounts.find(a => a.id === item.accountId)?.name || 'Linked Vault';
          return (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#334155' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={theme.boldText}>{item.label}</Text>
                  <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: item.isIncoming ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)' }}>
                    <Text style={{ fontSize: 9, color: item.isIncoming ? '#4ade80' : '#f87171', fontWeight: '800' }}>
                      {item.isIncoming ? 'INFLOW' : 'OUTFLOW'}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {item.frequency} • {item.category} • Account: {matchedAccName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* FIXED: Removed the trailing text fragment markup artifact completely */}
                <Text style={[theme.boldText, { color: item.isIncoming ? '#4ade80' : '#cbd5e1', marginRight: 12 }]}>
                  {item.isIncoming ? '+' : '-'}${item.amount.toFixed(2)}
                </Text>
                <TouchableOpacity 
                  style={[theme.secondaryButton, { borderColor: '#38bdf8', paddingVertical: 4, paddingHorizontal: 10 }]}
                  onPress={() => triggerEditRecurringFlow(item)}
                >
                  <Text style={[theme.secondaryButtonText, { color: '#38bdf8', fontSize: 11, fontWeight: '700' }]}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {recurringTransactions.length === 0 && <Text style={theme.mutedText}>No automation rules active. Deploy schedules inside the Quick Log modal panel.</Text>}
      </View>

      {/* CARD 3: OUTFLOW MANAGER */}
      <View style={theme.card} onLayout={(event) => setOutflowCardY(event.nativeEvent.layout.y)}>
        <Text style={theme.cardTitle}>Configure Outflow Categories</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15, alignItems: 'center' }}>
          <TextInput 
            style={[theme.input, { flex: 1, marginBottom: 0, height: 46 }]} 
            placeholder="New Outflow Category (e.g., Shopping)" 
            placeholderTextColor="#64748b"
            value={typedOutflowName}
            onChangeText={setTypedOutflowName}
            onFocus={handleOutflowInputFocus} 
          />
          <TouchableOpacity style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: '#38bdf8', alignItems: 'center', justifyContent: 'center' }} onPress={executeOutflowCategorySubmit}>
            <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '700' }}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {outflowCategories.map(cat => (
            <View key={cat} style={[theme.pill, { flexDirection: 'row', alignItems: 'center', borderColor: '#f87171', backgroundColor: '#1e293b' }]}>
              <Text style={[theme.pillText, { marginRight: 8, color: '#f87171' }]}>{cat}</Text>
              <TouchableOpacity onPress={() => onDeleteOutflowCategory(cat)}>
                <Text style={{ color: '#f87171', fontWeight: 'bold', fontSize: 12 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* CARD 4: INFLOW MANAGER */}
      <View style={theme.card} onLayout={(event) => setInflowCardY(event.nativeEvent.layout.y)}>
        <Text style={theme.cardTitle}>Configure Inflow Categories</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15, alignItems: 'center' }}>
          <TextInput 
            style={[theme.input, { flex: 1, marginBottom: 0, height: 46 }]} 
            placeholder="New Inflow Category (e.g., Side Hustle)" 
            placeholderTextColor="#64748b"
            value={typedInflowName}
            onChangeText={setTypedInflowName}
            onFocus={handleInflowInputFocus} 
          />
          <TouchableOpacity style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: '#4ade80', alignItems: 'center', justifyContent: 'center' }} onPress={executeInflowCategorySubmit}>
            <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '700' }}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {inflowCategories.map(cat => (
            <View key={cat} style={[theme.pill, { flexDirection: 'row', alignItems: 'center', borderColor: '#4ade80', backgroundColor: '#1e293b' }]}>
              <Text style={[theme.pillText, { marginRight: 8, color: '#4ade80' }]}>{cat}</Text>
              <TouchableOpacity onPress={() => onDeleteInflowCategory(cat)}>
                <Text style={{ color: '#f87171', fontWeight: 'bold', fontSize: 12 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* CARD 5: LEDGER RESET */}
      <View style={[theme.card, { borderColor: '#ef4444', borderWidth: 1, backgroundColor: 'rgba(239, 68, 68, 0.03)' }]}>
        <Text style={[theme.cardTitle, { color: '#f87171' }]}>Sovereign System Ledger Reset</Text>
        <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 14 }]}>
          Permanently wipe all local caches, portfolios, budgets, transactions, and user category frameworks from the device secure storage partition. This action cannot be reversed.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
          onPress={onHardResetApp}
        >
          <Text style={{ color: '#f8fafc', fontWeight: '700', fontSize: 14 }}>Wipe Local Application Data</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Math.max(keyboardOffset, 25) }} />

      {/* MODAL: ADD PORTFOLIO */}
      <Modal visible={isAddAccountModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsAddAccountModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <Text style={[theme.cardTitle, { fontSize: 18, marginBottom: 16 }]}>Link New Account Ledger</Text>
            <TextInput style={theme.input} placeholder="Account Structure Name (e.g., DBS Savings)" placeholderTextColor="#64748b" value={newAccountName} onChangeText={setNewAccountName} />
            <TextInput style={theme.input} placeholder="Starting Capital Value ($)" placeholderTextColor="#64748b" keyboardType="numeric" value={newAccountBalance} onChangeText={setNewAccountBalance} />
            <View style={[theme.modalActions, { gap: 10 }]}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#475569', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }} onPress={() => setIsAddAccountModalVisible(false)}><Text style={{ color: '#cbd5e1', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#38bdf8', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }} onPress={executeAddAccountSubmit}><Text style={{ color: '#0f172a', fontWeight: '700' }}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: INTEREST CONFIGS */}
      <Modal visible={isInterestModalVisible} animationType="fade" transparent={true} onRequestClose={() => { setIsInterestModalVisible(false); setTargetInterestAccountId(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <Text style={[theme.cardTitle, { fontSize: 18, marginBottom: 8 }]}>Adjust Yield Strategy</Text>
            <Text style={[theme.bodyText, { fontSize: 13, color: '#94a3b8', marginBottom: 18 }]}>
              Configure the bank account's Annual Interest Rate percentage (P.A.). At the end of every calendar month, earnings will compound automatically.
            </Text>
            <TextInput
              style={[theme.input, { color: '#f8fafc', fontSize: 16, backgroundColor: '#334155', borderWidth: 1, borderColor: '#475569' }]}
              placeholder="Interest Rate Percentage (e.g., 4.25)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={typedInterestRateInput}
              onChangeText={text => setTypedInterestRateInput(text.replace(/[^0-9.]/g, ''))}
              autoFocus={true}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 15 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#475569', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }} onPress={() => { setIsInterestModalVisible(false); setTargetInterestAccountId(null); }}><Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 15 }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#4ade80', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }} onPress={executeInterestRateSubmit}><Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 15 }}>Save Strategy</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: FULL AUTOMATION AMENDER */}
      <Modal visible={isEditRecModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsEditRecModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={theme.modalOverlay}>
          <View style={[theme.modalContent, { maxHeight: screenHeight * 0.85 }]}>
            <Text style={[theme.cardTitle, { fontSize: 18, marginBottom: 12 }]}>Reconfigure Automation Blueprint</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }} keyboardShouldPersistTaps="handled">
              
              <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>Directional Context Rule:</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                <TouchableOpacity style={[theme.pill, { flex: 1, alignItems: 'center' }, !recIsIncoming && { backgroundColor: '#f87171', borderColor: '#f87171' }]} onPress={() => { setRecIsIncoming(false); setRecCategory(outflowCategories[0] || ''); }}>
                  <Text style={[theme.pillText, !recIsIncoming && { color: '#0f172a', fontWeight: '700' }]}>Expense (-) Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[theme.pill, { flex: 1, alignItems: 'center' }, recIsIncoming && theme.activePill]} onPress={() => { setRecIsIncoming(true); setRecCategory(inflowCategories[0] || ''); }}>
                  <Text style={[theme.pillText, recIsIncoming && theme.activePillText]}>Inflow (+) Credit</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>Frequency Cycle Interval:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {['Weekly', 'Bi-Weekly', 'Monthly', 'Annual'].map(f => (
                  <TouchableOpacity key={f} style={[theme.pill, recFrequency === f && theme.activePill]} onPress={() => setRecFrequency(f)}>
                    <Text style={[theme.pillText, recFrequency === f && theme.activePillText]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>Link Ledger Account Destination:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {accounts.map(a => (
                  <TouchableOpacity key={a.id} style={[theme.pill, recAccountId === a.id && theme.activePill]} onPress={() => setRecAccountId(a.id)}>
                    <Text style={[theme.pillText, recAccountId === a.id && theme.activePillText]}>{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>Category Tag Assignment:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {activeModalCategories.map(c => (
                  <TouchableOpacity key={c} style={[theme.pill, recCategory === c && theme.activePill]} onPress={() => setRecCategory(c)}>
                    <Text style={[theme.pillText, recCategory === c && theme.activePillText]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Amount Plan Value ($):</Text>
              <TextInput style={theme.input} keyboardType="numeric" value={recAmount} onChangeText={setRecAmount} onFocus={handleAutomationsInputFocus} />

              <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Schedule Memo Description Tag:</Text>
              <TextInput style={theme.input} placeholder="E.g., Corporate Monthly Remittance" placeholderTextColor="#64748b" value={recLabel} onChangeText={setRecLabel} onFocus={handleAutomationsInputFocus} />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#475569', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={() => setIsEditRecModalVisible(false)}>
                  <Text style={{ color: '#cbd5e1', fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#f87171', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={executeDeleteRecurringSubmit}>
                  <Text style={{ color: '#0f172a', fontWeight: '700' }}>Delete Rules</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#34d399', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={executeUpdateRecurringSubmit}>
                  <Text style={{ color: '#0f172a', fontWeight: '700' }}>Save Specs</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}