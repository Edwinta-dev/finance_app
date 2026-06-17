// src/screens/Vault/index.js
import React from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Modal, KeyboardAvoidingView, Platform 
} from 'react-native';
import { theme, screenHeight } from '../../styles/theme';
import { useVaultState } from './useVaultState';
import { AssetsView } from './components/AssetsView';
import { YieldOptimizerView } from './components/YieldOptimizerView';

export function AccountsScreen(props) {
  const state = useVaultState(
    props.accounts, props.outflowCategories, props.inflowCategories, 
    props.onUpdateRecurring, props.onUpdateInterestRate
  );

  const executeAddAccountComplete = () => {
    if (!props.newAccountName || !props.newAccountBalance) return;
    props.onCreateAccount();
    
    // Check if initial custom yield target was typed; assign if cleared
    if (state.newAccountInterest.trim() && !isNaN(state.newAccountInterest)) {
      setTimeout(() => {
        const newlyCreated = props.accounts[props.accounts.length - 1];
        if (newlyCreated) {
          props.onUpdateInterestRate(newlyCreated.id, state.newAccountInterest.trim());
        } else {
          // Fallback context: loop fallback catch
          const matched = props.accounts.find(a => a.name === props.newAccountName);
          if (matched) props.onUpdateInterestRate(matched.id, state.newAccountInterest.trim());
        }
      }, 150);
    }
    state.setNewAccountInterest('');
    state.setIsAddAccountModalVisible(false);
  };

  const executeAccountModificationSave = () => {
    if (!state.selectedAccountId || !state.editingAccountName.trim()) return;
    
    // 1. Pass updated interest settings down directly to operational array parameters
    props.onUpdateInterestRate(state.selectedAccountId, state.editingAccountInterest || '0.0');
    
    // 2. Re-align base tracking properties natively via parent amenders
    const target = props.accounts.find(a => a.id === state.selectedAccountId);
    if (target) {
      target.name = state.editingAccountName.trim();
      target.balance = parseFloat(state.editingAccountBalance) || 0.0;
    }
    
    state.setIsEditAccountModalVisible(false);
    state.setSelectedAccountId(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* SEGMENTED TAB SELECTOR HEADER SWITCH */}
      <View style={{ flexDirection: 'row', backgroundColor: '#1e293b', padding: 4, borderRadius: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 10 }}>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: state.activeTab === 'assets' ? '#334155' : 'transparent' }} onPress={() => state.setActiveTab('assets')}>
          <Text style={{ color: state.activeTab === 'assets' ? '#f8fafc' : '#94a3b8', fontWeight: '700', fontSize: 13 }}>Assets & Config</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: state.activeTab === 'optimizer' ? '#334155' : 'transparent' }} onPress={() => state.setActiveTab('optimizer')}>
          <Text style={{ color: state.activeTab === 'optimizer' ? '#f8fafc' : '#94a3b8', fontWeight: '700', fontSize: 13 }}>Yield Optimizer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView scrollRef={props.scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {state.activeTab === 'assets' ? (
          <AssetsView 
            {...props} {...state}
            onAddAccountPress={() => state.setIsAddAccountModalVisible(true)}
          />
        ) : (
          <YieldOptimizerView 
            {...state} 
            onOptimize={state.handleCalculateOptimization}
          />
        )}
      </ScrollView>

      {/* MODAL 1: ADD NEW LEDGER CHANNEL */}
      <Modal visible={state.isAddAccountModalVisible} animationType="fade" transparent={true} onRequestClose={() => state.setIsAddAccountModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <Text style={[theme.cardTitle, { fontSize: 18, marginBottom: 16 }]}>Link New Account Ledger</Text>
            <TextInput style={theme.input} placeholder="Account Track Name (e.g., OCBC Savings)" placeholderTextColor="#64748b" value={props.newAccountName} onChangeText={props.setNewAccountName} />
            <TextInput style={theme.input} placeholder="Starting Capital Value ($)" placeholderTextColor="#64748b" keyboardType="numeric" value={props.newAccountBalance} onChangeText={props.setNewAccountBalance} />
            {/* FIXED: Added explicit initialization yield field target parameter directly inside addition panel */}
            <TextInput style={theme.input} placeholder="Target Interest Parameter (% P.A.)" placeholderTextColor="#64748b" keyboardType="numeric" value={state.newAccountInterest} onChangeText={state.setNewAccountInterest} />
            <View style={[theme.modalActions, { gap: 10 }]}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#475569', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={() => state.setIsAddAccountModalVisible(false)}><Text style={{ color: '#cbd5e1', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#38bdf8', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={executeAddAccountComplete}><Text style={{ color: '#0f172a', fontWeight: '700' }}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: UNIFIED MANAGEMENT CARD DIALOG BOX */}
      <Modal visible={state.isEditAccountModalVisible} animationType="fade" transparent={true} onRequestClose={() => state.setIsEditAccountModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <Text style={[theme.cardTitle, { fontSize: 18, marginBottom: 4 }]}>Adjust Portfolio Parameters</Text>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 15 }}>Update title tracks, reconcile capital valuations, or set interest profiles.</Text>
            
            <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: '600' }}>Ledger Registry Display Name:</Text>
            <TextInput style={theme.input} value={state.editingAccountName} onChangeText={state.setEditingAccountName} />

            <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: '600' }}>Reconciled Cash Balance ($):</Text>
            <TextInput style={theme.input} keyboardType="numeric" value={state.editingAccountBalance} onChangeText={state.setEditingAccountBalance} />

            <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: '600' }}>Annual Compounding Interest Yield Rate (% P.A.):</Text>
            <TextInput style={theme.input} keyboardType="numeric" value={state.editingAccountInterest} onChangeText={text => state.setEditingAccountInterest(text.replace(/[^0-9.]/g, ''))} />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#475569', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }} onPress={() => state.setIsEditAccountModalVisible(false)}><Text style={{ color: '#cbd5e1', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#34d399', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }} onPress={executeAccountModificationSave}><Text style={{ color: '#0f172a', fontWeight: '700' }}>Save Specs</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: FULL RECURRING SCHEDULER SYSTEM */}
      <Modal visible={state.isEditRecModalVisible} animationType="fade" transparent={true} onRequestClose={() => state.setIsEditRecModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={theme.modalOverlay}>
          <View style={[theme.modalContent, { maxHeight: screenHeight * 0.85 }]}>
            <Text style={[theme.cardTitle, { fontSize: 17, marginBottom: 12 }]}>Reconfigure Schedule Blueprint</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Direction Category Rule:</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                <TouchableOpacity style={[theme.pill, { flex: 1, alignItems: 'center' }, !state.recIsIncoming && { backgroundColor: '#f87171', borderColor: '#f87171' }]} onPress={() => state.setRecIsIncoming(false)}>
                  <Text style={{ fontSize: 11, color: !state.recIsIncoming ? '#0f172a' : '#cbd5e1', fontWeight: '700' }}>Expense (-)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[theme.pill, { flex: 1, alignItems: 'center' }, state.recIsIncoming && theme.activePill]} onPress={() => state.setRecIsIncoming(true)}>
                  <Text style={[theme.pillText, state.recIsIncoming && theme.activePillText]}>Inflow (+)</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Frequency Cycle Interval:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {['Weekly', 'Bi-Weekly', 'Monthly', 'Annual'].map(f => (
                  <TouchableOpacity key={f} style={[theme.pill, state.recFrequency === f && theme.activePill]} onPress={() => state.setRecFrequency(f)}>
                    <Text style={[theme.pillText, state.recFrequency === f && theme.activePillText]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Link Ledger Account Destination:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {props.accounts.map(a => (
                  <TouchableOpacity key={a.id} style={[theme.pill, state.recAccountId === a.id && theme.activePill]} onPress={() => state.setRecAccountId(a.id)}>
                    <Text style={[theme.pillText, state.recAccountId === a.id && theme.activePillText]}>{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Amount Value ($):</Text>
              <TextInput style={theme.input} keyboardType="numeric" value={state.recAmount} onChangeText={state.setRecAmount} />

              <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Memo Description Tag:</Text>
              <TextInput style={theme.input} value={state.recLabel} onChangeText={state.setRecLabel} />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#475569', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={() => state.setIsEditRecModalVisible(false)}><Text style={{ color: '#cbd5e1', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#f87171', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={() => { props.onDeleteRecurring(state.selectedRecId); state.setIsEditRecModalVisible(false); }}><Text style={{ color: '#0f172a', fontWeight: '700' }}>Delete</Text></TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#34d399', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={() => state.executeSaveAutomationSubmit(true)}><Text style={{ color: '#0f172a', fontWeight: '700' }}>Save Specs</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}