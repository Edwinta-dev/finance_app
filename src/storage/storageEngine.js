// src/storage/storageEngine.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const loadLocalBudgetData = async (setAccounts, setTransactions) => {
  try {
    const storedAccounts = await AsyncStorage.getItem('@budget_accounts');
    const storedTransactions = await AsyncStorage.getItem('@budget_transactions');
    if (storedAccounts) setAccounts(JSON.parse(storedAccounts));
    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
  } catch (e) {
    Alert.alert("Error", "Failed to load local transaction entries.");
  }
};

export const saveLocalBudgetData = async (updatedAccounts, updatedTransactions) => {
  try {
    await AsyncStorage.setItem('@budget_accounts', JSON.stringify(updatedAccounts));
    await AsyncStorage.setItem('@budget_transactions', JSON.stringify(updatedTransactions));
  } catch (e) {
    Alert.alert("Error", "Failed to preserve active balance state data.");
  }
};