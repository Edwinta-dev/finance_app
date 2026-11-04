// src/screens/ReviewScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

const sourceLabel = (source) =>
  ({ bank_notification: 'Bank notification', bank_camera: 'Bank app + camera', notification: 'Notification' }[source] || source);

const ReviewItem = ({ item, categories, onConfirm, onReject }) => {
  const [category, setCategory] = useState(null);
  const [amount, setAmount] = useState(item.amount > 0 ? String(item.amount) : '');
  const needsAmount = !(item.amount > 0);
  const when = new Date(item.ts).toLocaleString();

  return (
    <View style={theme.card}>
      <Text style={theme.boldText}>
        {item.amount > 0 ? `SGD ${item.amount.toFixed(2)}` : 'Possible payment'}
        {item.direction === 'inflow' ? ' (in)' : ''}
        {item.memo ? ` · ${item.memo}` : ''}
      </Text>
      <Text style={theme.mutedText}>{sourceLabel(item.source)} · {when}</Text>

      {needsAmount && (
        <TextInput
          style={theme.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount"
          keyboardType="decimal-pad"
        />
      )}

      <View style={theme.pillContainer}>
        {categories.map((c) => (
          <TouchableOpacity key={c} style={[theme.pill, category === c && theme.activePill]} onPress={() => setCategory(c)}>
            <Text style={[theme.pillText, category === c && theme.activePillText]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={theme.actionRow}>
        <TouchableOpacity style={theme.primaryButton} onPress={() => onConfirm(item, category, amount)}>
          <Text style={theme.buttonText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={theme.secondaryButton} onPress={() => onReject(item)}>
          <Text style={theme.secondaryButtonText}>Not mine</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const ReviewScreen = ({ items, outflowCategories, inflowCategories, onConfirm, onReject }) => (
  <View>
    <Text style={theme.sectionHeader}>Review ({items.length})</Text>
    {items.length === 0 && <Text style={theme.mutedText}>Nothing waiting for review.</Text>}
    {items.map((item) => (
      <ReviewItem
        key={item.id}
        item={item}
        categories={item.direction === 'inflow' ? inflowCategories : outflowCategories}
        onConfirm={onConfirm}
        onReject={onReject}
      />
    ))}
  </View>
);
