// src/screens/AccountsScreen.js
import React, { useState, useEffect } from 'react'; // Added useEffect for native keyboard listeners
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Modal, KeyboardAvoidingView, Platform, Keyboard // Added Keyboard tracking driver
} from 'react-native';
import { theme } from '../styles/theme.js';

export function AccountsScreen({
  accounts, newAccountName, setNewAccountName, newAccountBalance, setNewAccountBalance,
  onCreateAccount, onSetFavorite, onTriggerReconcile, onDeleteAccount,
  outflowCategories, inflowCategories, onAddOutflowCategory, onDeleteOutflowCategory, onAddInflowCategory, onDeleteInflowCategory,
  scrollRef 
}) {
  const [isAddAccountModalVisible, setIsAddAccountModalVisible] = useState(false);
  const [typedOutflowName, setTypedOutflowName] = useState('');
  const [typedInflowName, setTypedInflowName] = useState('');

  // --- NEW: DYNAMIC CLEARANCE BUFFER STATE ---
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Dynamic Position Element Trackers
  const [outflowCardY, setOutflowCardY] = useState(0);
  const [inflowCardY, setInflowCardY] = useState(0);

  // --- AUTOMATIC SYSTEM KEYBOARD MONITOR PIPELINE ---
  useEffect(() => {
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const hideListener = Keyboard.addListener(hideEvent, () => {
      // Instantly clear out buffer spacer when user dismisses input fields
      setKeyboardOffset(0);
    });

    return () => {
      hideListener.remove();
    };
  }, []);

  const handleOutflowInputFocus = () => {
    // Inject structural headroom buffer instantly ahead of scrolling calculation triggers
    setKeyboardOffset(Platform.OS === 'ios' ? 260 : 240);
    
    setTimeout(() => {
      if (scrollRef?.current) {
        scrollRef.current.scrollTo({ y: outflowCardY - 10, animated: true });
      }
    }, 80);
  };

  const handleInflowInputFocus = () => {
    // Inject maximum structural headroom buffer to allow bottom-most block to elevate fully
    setKeyboardOffset(Platform.OS === 'ios' ? 340 : 320);
    
    setTimeout(() => {
      if (scrollRef?.current) {
        // Now has sufficient expansion room underneath to complete this travel slide
        scrollRef.current.scrollTo({ y: inflowCardY - 10, animated: true });
      }
    }, 80);
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

  return (
    <View style={{ flex: 1 }}>
      
      {/* Linked Cash Portfolios Card Block */}
      <View style={theme.card}>
        <View style={theme.cardHeaderTitleRow}>
          <Text style={theme.cardInlineTitle}>Linked Cash Portfolios</Text>
          <TouchableOpacity 
            style={[theme.secondaryButton, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}
            onPress={() => setIsAddAccountModalVisible(true)}
          >
            <Text style={theme.secondaryButtonText}>+ New Account</Text>
          </TouchableOpacity>
        </View>

        {accounts.map(acc => (
          <View key={acc.id} style={[theme.accountCard, { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={theme.boldText}>{acc.name} {acc.isFavorite && '⭐'}</Text>
              <Text style={[theme.boldText, { color: '#38bdf8', fontSize: 16, marginTop: 2 }]}>
                ${acc.balance.toFixed(2)}
              </Text>
            </View>
            <View style={theme.actionRow}>
              {!acc.isFavorite && (
                <TouchableOpacity style={theme.secondaryButton} onPress={() => onSetFavorite(acc.id)}>
                  <Text style={theme.secondaryButtonText}>Fave</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[theme.secondaryButton, { borderColor: '#fb923c' }]} onPress={() => onTriggerReconcile(acc.id)}>
                <Text style={[theme.secondaryButtonText, { color: '#fb923c' }]}>Fix</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[theme.secondaryButton, { borderColor: '#f87171' }]} onPress={() => onDeleteAccount(acc.id)}>
                <Text style={[theme.secondaryButtonText, { color: '#f87171' }]}>Del</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {accounts.length === 0 && <Text style={theme.mutedText}>No active cash accounts found.</Text>}
      </View>

      {/* Configure Outflow Spending Categories Matrix Block */}
      <View 
        style={theme.card}
        onLayout={(event) => setOutflowCardY(event.nativeEvent.layout.y)}
      >
        <Text style={theme.cardTitle}>Configure Outflow Categories</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
          <TextInput 
            style={[theme.input, { flex: 1, marginBottom: 0 }]} 
            placeholder="New Outflow Category (e.g., Shopping)" 
            placeholderTextColor="#94a3b8"
            value={typedOutflowName}
            onChangeText={setTypedOutflowName}
            onFocus={handleOutflowInputFocus} 
          />
          <TouchableOpacity style={[theme.primaryButton, { marginTop: 0 }]} onPress={executeOutflowCategorySubmit}>
            <Text style={theme.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {outflowCategories.map(cat => (
            <View key={cat} style={[theme.pill, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b' }]}>
              <Text style={[theme.pillText, { marginRight: 8 }]}>{cat}</Text>
              <TouchableOpacity onPress={() => onDeleteOutflowCategory(cat)}>
                <Text style={{ color: '#f87171', fontWeight: 'bold', fontSize: 12 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Configure Inflow Credit Categories Matrix Block */}
      <View 
        style={theme.card}
        onLayout={(event) => setInflowCardY(event.nativeEvent.layout.y)}
      >
        <Text style={theme.cardTitle}>Configure Inflow Categories</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
          <TextInput 
            style={[theme.input, { flex: 1, marginBottom: 0 }]} 
            placeholder="New Inflow Category (e.g., Side Hustle)" 
            placeholderTextColor="#94a3b8"
            value={typedInflowName}
            onChangeText={setTypedInflowName}
            onFocus={handleInflowInputFocus} 
          />
          <TouchableOpacity style={[theme.primaryButton, { marginTop: 0, backgroundColor: '#4ade80' }]} onPress={executeInflowCategorySubmit}>
            <Text style={[theme.buttonText, { color: '#0f172a' }]}>Add</Text>
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

      {/* NEW: Dynamic layout padding clearance spacer blocks */}
      <View style={{ height: keyboardOffset }} />

      {/* LINK PORTFOLIO OVERLAY MODAL */}
      <Modal 
        visible={isAddAccountModalVisible} 
        animationType="fade" 
        transparent={true}
        onRequestClose={() => setIsAddAccountModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <Text style={[theme.cardTitle, { fontSize: 18, marginBottom: 16 }]}>Link New Account Ledger</Text>
            
            <TextInput 
              style={theme.input} 
              placeholder="Account Structure Name (e.g., DBS Savings)" 
              placeholderTextColor="#94a3b8"
              value={newAccountName}
              onChangeText={setNewAccountName}
            />
            
            <TextInput 
              style={theme.input} 
              placeholder="Starting Capital Value ($)" 
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={newAccountBalance}
              onChangeText={setNewAccountBalance}
            />

            <View style={[theme.modalActions, { gap: 10 }]}>
              <TouchableOpacity 
                style={[theme.primaryButton, { flex: 1, backgroundColor: '#64748b', marginTop: 0 }]} 
                onPress={() => setIsAddAccountModalVisible(false)}
              >
                <Text style={theme.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[theme.primaryButton, { flex: 1, marginTop: 0 }]} 
                onPress={executeAddAccountSubmit}
              >
                <Text style={theme.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}