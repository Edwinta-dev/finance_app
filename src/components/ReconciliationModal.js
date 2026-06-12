// src/components/ReconciliationModal.js
import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

export function ReconciliationModal({ visible, setVisible, balanceInput, setBalanceInput, onApply }) {
  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={theme.modalOverlay}>
        <View style={theme.modalContent}>
          <Text style={theme.cardTitle}>Manual Balance Reconciliation</Text>
          <Text style={theme.bodyText}>Input the actual accurate balance showing directly on your bank statement right now:</Text>
          <TextInput 
            style={[theme.input, { marginTop: 15 }]} 
            placeholder="Actual Bank Balance ($)" 
            keyboardType="numeric"
            value={balanceInput}
            onChangeText={setBalanceInput}
          />
          <View style={theme.modalActions}>
            <TouchableOpacity style={[theme.primaryButton, { flex: 1, marginRight: 10 }]} onPress={onApply}>
              <Text style={theme.buttonText}>Apply Fix</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[theme.secondaryButton, { flex: 1 }]} onPress={() => setVisible(false)}>
              <Text style={theme.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}