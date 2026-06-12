// src/screens/AccountsScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../styles/theme';

export function AccountsScreen({ 
  accounts, newAccountName, setNewAccountName, newAccountBalance, 
  setNewAccountBalance, onCreateAccount, onSetFavorite, onTriggerReconcile, onDeleteAccount,
  categories, onAddCategory, onDeleteCategory // Recieved properties handling taxonomy alterations
}) {
  const [newCatName, setNewCatName] = useState('');

  const executeCategoryAdd = () => {
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName('');
  };

  return (
    <View>
      {/* Account portfolio builder */}
      <View style={theme.card}>
        <Text style={theme.cardTitle}>Add New Bank Account</Text>
        <TextInput style={theme.input} placeholder="Bank Name" placeholderTextColor="#94a3b8" value={newAccountName} onChangeText={setNewAccountName} />
        <TextInput style={theme.input} placeholder="Initial Balance" placeholderTextColor="#94a3b8" keyboardType="numeric" value={newAccountBalance} onChangeText={setNewAccountBalance} />
        <TouchableOpacity style={theme.primaryButton} onPress={onCreateAccount}>
          <Text style={theme.buttonText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      {/* Account records listing */}
      <Text style={theme.sectionHeader}>Manage Details & Reconcile</Text>
      {accounts.map(acc => (
        <View key={acc.id} style={[theme.card, theme.accountCard]}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={theme.boldText}>{acc.name} {acc.isFavorite && '(Favorite)'}</Text>
            <Text style={theme.bodyText}>Current State: ${acc.balance.toFixed(2)}</Text>
          </View>
          <View style={[theme.actionRow, { flexWrap: 'wrap', justifyContent: 'flex-end' }]}>
            {!acc.isFavorite && (
              <TouchableOpacity style={theme.secondaryButton} onPress={() => onSetFavorite(acc.id)}>
                <Text style={theme.secondaryButtonText}>Set Fav</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[theme.secondaryButton, { borderColor: '#e74c3c' }]} onPress={() => onTriggerReconcile(acc.id)}>
              <Text style={[theme.secondaryButtonText, { color: '#e74c3c' }]}>Tweak</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[theme.secondaryButton, { backgroundColor: '#ef4444', borderColor: '#ef4444' }]} onPress={() => onDeleteAccount(acc.id)}>
              <Text style={[theme.secondaryButtonText, { color: '#ffffff' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Enhancement 2 Category Management Control Section */}
      <Text style={theme.sectionHeader}>Configure Spending Categories</Text>
      <View style={theme.card}>
        <TextInput 
          style={theme.input} 
          placeholder="New Category Label (e.g., Subscriptions)" 
          placeholderTextColor="#94a3b8" 
          value={newCatName} 
          onChangeText={setNewCatName} 
        />
        <TouchableOpacity style={[theme.primaryButton, { backgroundColor: '#4ade80' }]} onPress={executeCategoryAdd}>
          <Text style={theme.buttonText}>Add Category To Defaults</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 15 }}>
          {categories.map(cat => (
            <View key={cat} style={theme.accountRowItem}>
              <Text style={theme.bodyText}>{cat}</Text>
              <TouchableOpacity 
                style={{ borderWidth: 1, borderColor: '#f87171', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10 }}
                onPress={() => onDeleteCategory(cat)}
              >
                <Text style={{ color: '#f87171', fontSize: 12, fontWeight: 'bold' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}