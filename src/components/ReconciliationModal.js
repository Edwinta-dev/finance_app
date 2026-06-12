// src/components/ReconciliationModal.js
import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../styles/theme.js';

export function ReconciliationModal({ visible, setVisible, balanceInput, setBalanceInput, onApply }) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={theme.modalOverlay}
      >
        <View style={theme.modalContent}>
          <Text style={[theme.cardTitle, { fontSize: 18, marginBottom: 8 }]}>Manual Balance Audit Tweak</Text>
          <Text style={[theme.bodyText, { fontSize: 13, color: '#94a3b8', marginBottom: 18 }]}>
            Type in the current accurate capital holdings value. The application layout matrix will calculate and log the reconciliation discrepancy automatically.
          </Text>

          <TextInput
            // FIXED: Explicit color overrides remove muddy low-contrast text profiles on all screens
            style={[theme.input, { color: '#f8fafc', fontSize: 16, backgroundColor: '#334155', borderWidth: 1, borderColor: '#475569' }]}
            placeholder="Actual Bank Balance ($)"
            placeholderTextColor="#94a3b8" // Crisp high-contrast placeholder
            keyboardType="numeric"
            value={balanceInput}
            onChangeText={setBalanceInput}
            autoFocus={true}
          />

          {/* FIXED: Action layout handles identical symmetric dimension profiles */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 15 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#475569',
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onPress={() => { setVisible(false); setBalanceInput(''); }}
            >
              {/* FIXED: Match font weights, heights, and center alignment matrix metrics perfectly */}
              <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#fb923c',
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onPress={onApply}
            >
              <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
                Apply Fix
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}