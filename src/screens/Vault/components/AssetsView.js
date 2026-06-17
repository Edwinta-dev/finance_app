// src/screens/Vault/components/AssetsView.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../../../styles/theme';

export function AssetsView({
  accounts, recurringTransactions, outflowCategories, inflowCategories,
  categoryMode, setCategoryType, typedCategoryName, setTypedCategoryName,
  isAddingAutomation, setIsAddingAutomation, recLabel, setRecLabel, recAmount, setRecAmount,
  recIsIncoming, setRecIsIncoming,
  onAddAccountPress, triggerAccountEditingFlow, onDeleteAccount,
  triggerNewAutomationFlow, triggerEditRecurringFlow, executeSaveAutomationSubmit,
  executeCategorySubmit, onDeleteOutflowCategory, onDeleteInflowCategory, onHardResetApp
}) {
  return (
    <View>
      {/* SECTION 1.1: Cash Portfolios Card */}
      <View style={theme.card}>
        <View style={theme.cardHeaderTitleRow}>
          <Text style={theme.cardInlineTitle}>Linked Cash Portfolios</Text>
          <TouchableOpacity style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }} onPress={onAddAccountPress}>
            <Text style={[theme.secondaryButtonText, { fontSize: 12, color: '#38bdf8' }]}>+ New Account</Text>
          </TouchableOpacity>
        </View>

        {accounts.map(acc => {
          const ratePA = acc.interestRate !== undefined ? acc.interestRate : 0.0;
          return (
            <View key={acc.id} style={{ flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#334155', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[theme.boldText, { color: '#f8fafc' }]}>{acc.name} {acc.isFavorite && '⭐'}</Text>
                <Text style={{ color: '#38bdf8', fontSize: 16, fontWeight: '700', marginTop: 2 }}>${acc.balance.toFixed(2)}</Text>
                <Text style={{ color: ratePA > 0 ? '#4ade80' : '#64748b', fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                  Yield Parameter: {ratePA.toFixed(2)}% P.A.
                </Text>
              </View>
              {/* FIXED: Collapsed old multi-button rows entirely into clear, high-utility Edit/Del paths */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity style={{ borderColor: '#38bdf8', borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }} onPress={() => triggerAccountEditingFlow(acc)}>
                  <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '700' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ borderColor: '#f87171', borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }} onPress={() => onDeleteAccount(acc.id)}>
                  <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '700' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {accounts.length === 0 && <Text style={theme.mutedText}>No active cash accounts logged.</Text>}
      </View>

      {/* SECTION 1.2: Automation Management Card */}
      <View style={theme.card}>
        <View style={theme.cardHeaderTitleRow}>
          <Text style={theme.cardInlineTitle}>Automated Schedules</Text>
          <TouchableOpacity style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }} onPress={triggerNewAutomationFlow}>
            <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '700' }}>+ Create Rule</Text>
          </TouchableOpacity>
        </View>

        {isAddingAutomation && (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginVertical: 10, borderLeftWidth: 3, borderLeftColor: '#4ade80' }}>
            <Text style={{ color: '#f8fafc', fontWeight: '700', fontSize: 13, marginBottom: 8 }}>Deploy Automation Rule Specification</Text>
            <TextInput style={[theme.input, { height: 40, fontSize: 13, backgroundColor: '#334155' }]} placeholder="Schedule Name Memo (e.g., Internet Bill)" placeholderTextColor="#64748b" value={recLabel} onChangeText={setRecLabel} />
            <TextInput style={[theme.input, { height: 40, fontSize: 13, backgroundColor: '#334155' }]} placeholder="Cash Value Amount ($)" placeholderTextColor="#64748b" keyboardType="numeric" value={recAmount} onChangeText={setRecAmount} />
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 10 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 6, borderRadius: 4, alignItems: 'center', backgroundColor: !recIsIncoming ? '#f87171' : '#334155' }} onPress={() => setRecIsIncoming(false)}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: !recIsIncoming ? '#0f172a' : '#94a3b8' }}>Expense (-)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 6, borderRadius: 4, alignItems: 'center', backgroundColor: recIsIncoming ? '#4ade80' : '#334155' }} onPress={() => setRecIsIncoming(true)}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: recIsIncoming ? '#0f172a' : '#94a3b8' }}>Inflow (+)</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'flex-end' }}>
              <TouchableOpacity style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#475569' }} onPress={() => setIsAddingAutomation(false)}>
                <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#4ade80' }} onPress={() => executeSaveAutomationSubmit(false)}>
                <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700' }}>Deploy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {recurringTransactions.map(item => {
          const matchedAccName = accounts.find(a => a.id === item.accountId)?.name || 'Linked Vault';
          return (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#334155' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[theme.boldText, { color: '#f8fafc' }]}>{item.label}</Text>
                  <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: item.isIncoming ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)' }}>
                    <Text style={{ fontSize: 8, color: item.isIncoming ? '#4ade80' : '#f87171', fontWeight: '800' }}>
                      {item.isIncoming ? 'INFLOW' : 'OUTFLOW'}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.frequency} • {item.category} • {matchedAccName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[theme.boldText, { color: item.isIncoming ? '#4ade80' : '#cbd5e1', marginRight: 10, fontSize: 14 }]}>
                  {item.isIncoming ? '+' : '-'}${item.amount.toFixed(2)}
                </Text>
                <TouchableOpacity style={{ borderColor: '#38bdf8', borderWidth: 0.5, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 }} onPress={() => triggerEditRecurringFlow(item)}>
                  <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: '700' }}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* SECTION 1.3: Unified Category Tracking Config Card */}
      <View style={theme.card}>
        <Text style={theme.cardTitle}>Configure Framework Categories</Text>
        
        {/* Category Segment Context Selector Bar Component */}
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12, backgroundColor: '#0f172a', padding: 3, borderRadius: 8 }}>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: categoryMode === 'outflow' ? '#1e293b' : 'transparent' }} onPress={() => setCategoryType('outflow')}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: categoryMode === 'outflow' ? '#f87171' : '#64748b' }}>Outflow Tags</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: categoryMode === 'inflow' ? '#1e293b' : 'transparent' }} onPress={() => setCategoryType('inflow')}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: categoryMode === 'inflow' ? '#4ade80' : '#64748b' }}>Inflow Tags</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <TextInput 
            style={[theme.input, { flex: 1, marginBottom: 0, height: 42, fontSize: 13, backgroundColor: '#1e293b' }]} 
            placeholder={`Add to ${categoryMode} map registry...`} 
            placeholderTextColor="#64748b" 
            value={typedCategoryName} 
            onChangeText={setTypedCategoryName} 
          />
          {/* FIXED: The plus button accent color remains cleanly focused */}
          <TouchableOpacity style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: categoryMode === 'outflow' ? '#f87171' : '#4ade80', alignItems: 'center', justifyContent: 'center' }} onPress={executeCategorySubmit}>
            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800' }}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {/* FIXED: Removed the distracting red/green fills from pill blocks; normalized to neutral corporate slate tags */}
          {(categoryMode === 'outflow' ? outflowCategories : inflowCategories).map(cat => (
            <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b' }}>
              <Text style={{ marginRight: 8, fontSize: 12, fontWeight: '600', color: '#cbd5e1' }}>{cat}</Text>
              <TouchableOpacity onPress={() => categoryMode === 'outflow' ? onDeleteOutflowCategory(cat) : onDeleteInflowCategory(cat)}>
                <Text style={{ color: '#64748b', fontWeight: '800', fontSize: 11 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* SYSTEM ZERO RESET CARD */}
      <View style={{ borderColor: '#ef4444', borderWidth: 1, padding: 16, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.02)', marginTop: 10 }}>
        <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>Sovereign System Ledger Reset</Text>
        <Text style={{ fontSize: 11, color: '#94a3b8', lineHeight: 15, marginBottom: 12 }}>Permanently wipe all local caches from the device secure storage partition.</Text>
        <TouchableOpacity style={{ backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }} onPress={onHardResetApp}>
          <Text style={{ color: '#f8fafc', fontWeight: '700', fontSize: 12 }}>Wipe Local Application Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}