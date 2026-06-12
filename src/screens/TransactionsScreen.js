// src/screens/TransactionsScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme, screenWidth } from '../styles/theme.js';

export function TransactionsScreen({ 
  accounts, transactions, onDeleteTransaction, onEditTransaction, outflowCategories, inflowCategories 
}) {
  // FIXED: Track accordion visibility state uniquely for each account ID
  const [expandedAccountsMap, setExpandedAccountsMap] = useState({});

  // Amendment modal state handlers
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isTxTypeInflow, setIsTxTypeInflow] = useState(false);

  const toggleAccountAccordion = (accountId) => {
    setExpandedAccountsMap(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const triggerEditModalFlow = (tx) => {
    setEditingTxId(tx.id);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category);
    setEditDate(tx.date);
    setEditNote(tx.note || '');
    setIsTxTypeInflow(tx.type === 'Inflow Credit');
    setIsEditModalVisible(true);
  };

  const executeAmendmentSubmit = () => {
    if (!editingTxId || !editAmount.trim() || !editDate.trim()) return;
    onEditTransaction(editingTxId, editAmount, editCategory, editDate, editNote);
    setIsEditModalVisible(false);
    setEditingTxId(null);
  };

  const adaptiveCategoryCollection = isTxTypeInflow ? inflowCategories : outflowCategories;

  return (
    <View style={{ flex: 1 }}>
      <Text style={theme.sectionHeader}>Portfolio Ledgers Breakdown</Text>
      
      {/* FIXED: Restored Account-level dropdown tree architecture */}
      {accounts.map(acc => {
        // Isolate specific account records
        const accountTransactions = transactions.filter(t => t.accountId === acc.id);
        const isExpanded = !!expandedAccountsMap[acc.id];

        // Compute net directional yield indicator labels
        const netInflows = accountTransactions.filter(t => t.type === 'Inflow Credit').reduce((s, t) => s + t.amount, 0);
        const netOutflows = accountTransactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
        const profitMargin = netInflows - netOutflows;

        return (
          <View key={acc.id} style={[theme.card, { paddingVertical: 10, marginBottom: 12 }]}>
            {/* Interactive Accordion Row Header */}
            <TouchableOpacity 
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}
              onPress={() => toggleAccountAccordion(acc.id)}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[theme.cardTitle, { marginBottom: 2 }]}>{acc.name} {acc.isFavorite && '⭐'}</Text>
                <Text style={[theme.bodyText, { fontSize: 13, color: '#94a3b8' }]}>
                  Value: <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>${acc.balance.toFixed(2)}</Text>
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {accountTransactions.length > 0 && (
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: '700', 
                    color: profitMargin >= 0 ? '#4ade80' : '#f87171',
                    backgroundColor: profitMargin >= 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
                  }}>
                    {profitMargin >= 0 ? '+' : '-'}${Math.abs(profitMargin).toFixed(0)} month net
                  </Text>
                )}
                <Text style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 16 }}>
                  {isExpanded ? '▲' : '▼'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Hidden transaction log panel list toggled by accordion state */}
            {isExpanded && (
              <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 5 }}>
                {accountTransactions.map(tx => {
                  const isExpense = tx.type === 'Expense';
                  const isAdjustment = tx.type === 'Balance Adjustment';
                  let displayColor = '#38bdf8';
                  if (isExpense) displayColor = '#f87171';
                  if (tx.type === 'Inflow Credit') displayColor = '#4ade80';

                  return (
                    <View key={tx.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={{ color: '#f8fafc', fontWeight: '600', fontSize: 13 }}>{tx.category}</Text>
                          <Text style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>{tx.date} {tx.note ? `| "${tx.note}"` : ''}</Text>
                        </View>
                        
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: displayColor, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
                            {isExpense ? '-' : isAdjustment ? '' : '+'}${tx.amount.toFixed(2)}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity 
                              style={{ borderColor: '#fb923c', borderWidth: 1, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 }}
                              onPress={() => triggerEditModalFlow(tx)}
                            >
                              <Text style={{ color: '#fb923c', fontSize: 10, fontWeight: '700' }}>Amend</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={{ borderColor: '#f87171', borderWidth: 1, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 }}
                              onPress={() => onDeleteTransaction(tx.id)}
                            >
                              <Text style={{ color: '#f87171', fontSize: 10, fontWeight: '700' }}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {accountTransactions.length === 0 && (
                  <Text style={[theme.mutedText, { textAlign: 'center', marginVertical: 15, fontSize: 12 }]}>
                    No registered transactions logged under this account.
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}

      {accounts.length === 0 && (
        <View style={theme.card}>
          <Text style={theme.mutedText}>Create a cash account portfolio to activate ledger auditing files.</Text>
        </View>
      )}

      {/* AMENDMENT POP-UP DIALOG OVERLAY */}
      <Modal visible={isEditModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={theme.modalOverlay}>
          <View style={[theme.modalContent, { width: screenWidth - 24, paddingVertical: 20 }]}>
            <Text style={[theme.cardTitle, { fontSize: 18, marginBottom: 4 }]}>Amend Item Parameter</Text>
            <Text style={[theme.bodyText, { fontSize: 12, color: '#94a3b8', marginBottom: 16 }]}>
              Modify numerical logs or change timestamps to back-test previous graph columns.
            </Text>

            <Text style={[theme.boldText, { fontSize: 12, color: '#cbd5e1', marginBottom: 4 }]}>Transaction Amount ($):</Text>
            <TextInput style={[theme.input, { color: '#f8fafc', fontSize: 15, backgroundColor: '#334155' }]} placeholder="Amount ($)" placeholderTextColor="#64748b" keyboardType="numeric" value={editAmount} onChangeText={setEditAmount} />

            <Text style={[theme.boldText, { fontSize: 12, color: '#cbd5e1', marginBottom: 4 }]}>Calendar Timestamp (YYYY-MM-DD):</Text>
            <TextInput style={[theme.input, { color: '#f8fafc', fontSize: 15, backgroundColor: '#334155' }]} placeholder="e.g. 2026-04-15" placeholderTextColor="#64748b" value={editDate} onChangeText={setEditDate} />

            <Text style={[theme.boldText, { fontSize: 12, color: '#cbd5e1', marginBottom: 4 }]}>Custom Memo Annotation Note:</Text>
            <TextInput style={[theme.input, { color: '#f8fafc', fontSize: 15, backgroundColor: '#334155' }]} placeholder="Annotation context note (Optional)" placeholderTextColor="#64748b" value={editNote} onChangeText={setEditNote} />

            <Text style={[theme.boldText, { fontSize: 12, color: '#cbd5e1', marginBottom: 6 }]}>Category Re-allocation assignment:</Text>
            
            {/* FIXED: Removed maxHeight boundary constraint & injected nested contentContainerStyle logic 
                to stop horizontal category text selector container elements from clipping on iOS viewports */}
            <View style={{ height: 42, marginBottom: 18 }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingVertical: 2, paddingHorizontal: 2, alignItems: 'center' }}
              >
                {adaptiveCategoryCollection.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[theme.pill, { marginVertical: 0 }, editCategory === cat && { backgroundColor: isTxTypeInflow ? '#4ade80' : '#38bdf8' }]} 
                    onPress={() => setEditCategory(cat)}
                  >
                    <Text style={[theme.pillText, editCategory === cat && { color: '#0f172a', fontWeight: '700' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#475569', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }} onPress={() => setIsEditModalVisible(false)}><Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 15 }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#fb923c', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }} onPress={executeAmendmentSubmit}><Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 15 }}>Apply Changes</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}