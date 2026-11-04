// src/screens/SettingsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { SIGNALS, defaultValues, isActive, loadValues, toggleSignal } from '../settings/signals';

export const SettingsScreen = ({ native, permissions }) => {
  const [values, setValues] = useState(defaultValues());

  useEffect(() => {
    loadValues(native).then(setValues);
  }, [native]);

  const onToggle = async (key, enabled) => {
    try {
      setValues(await toggleSignal({ key, enabled, values, native, permissions }));
    } catch (e) {
      Alert.alert('Could not change this setting', 'Nothing was changed.');
    }
  };

  const onClear = (signal) =>
    Alert.alert(
      'Delete waiting suggestions?',
      `This removes suggestions from "${signal.title}" that you have not confirmed yet. Confirmed transactions are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => native.clearUnconfirmed([signal.clearSource]).catch(() => {}),
        },
      ]
    );

  return (
    <View>
      <Text style={theme.sectionHeader}>Automatic signals</Text>
      <Text style={theme.mutedText}>
        Everything here is optional and off until you turn it on. All data stays on this phone. You can turn any signal off at any time.
      </Text>
      {SIGNALS.map((signal) => {
        const parentOff = signal.dependsOn && !isActive(signal.dependsOn, values);
        return (
          <View key={signal.key} style={[theme.card, parentOff && { opacity: 0.5 }]}>
            <View style={theme.cardHeaderTitleRow}>
              <Text style={[theme.boldText, { flex: 1 }]}>{signal.title}</Text>
              <Switch
                value={!!values[signal.key]}
                disabled={!!parentOff}
                onValueChange={(v) => onToggle(signal.key, v)}
                accessibilityLabel={signal.title}
              />
            </View>
            <Text style={theme.mutedText}>{signal.explanation}</Text>
            {signal.clearSource && (
              <TouchableOpacity style={theme.secondaryButton} onPress={() => onClear(signal)}>
                <Text style={theme.secondaryButtonText}>Delete waiting suggestions</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
};
