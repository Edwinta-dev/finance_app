// App.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';

import { theme } from './src/styles/theme';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AccountsScreen } from './src/screens/AccountsScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { ReconciliationModal } from './src/components/ReconciliationModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const mainScrollRef = React.useRef(null);

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Custom Taxonomy State Registers
  const [categories, setCategories] = useState(['Food', 'Transport', 'Groceries', 'Utilities', 'Personal', 'Miscellaneous', 'Health']);
  const [recurringTransactions, setRecurringTransactions] = useState([]);

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food'); // Default linked token assignment
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [reconModalVisible, setReconModalVisible] = useState(false);
  const [reconAccountId, setReconAccountId] = useState(null);
  const [reconNewBalance, setReconNewBalance] = useState('');

  useEffect(() => {
    loadGlobalState();
  }, []);

  const loadGlobalState = async () => {
    try {
      const storedAccs = await AsyncStorage.getItem('@budget_accounts');
      const storedTxs = await AsyncStorage.getItem('@budget_transactions');
      const storedCats = await AsyncStorage.getItem('@budget_categories');
      const storedRecs = await AsyncStorage.getItem('@budget_recurring');
      
      if (storedAccs) setAccounts(JSON.parse(storedAccs));
      if (storedTxs) setTransactions(JSON.parse(storedTxs));
      if (storedCats) setCategories(JSON.parse(storedCats));
      if (storedRecs) setRecurringTransactions(JSON.parse(storedRecs));
    } catch (e) {
      Alert.alert("Data Failure", "Failed to resolve device persistent file mapping logs.");
    }
  };

  const syncCache = async (accs, txs, cats, recs) => {
    try {
      await AsyncStorage.setItem('@budget_accounts', JSON.stringify(accs));
      await AsyncStorage.setItem('@budget_transactions', JSON.stringify(txs));
      await AsyncStorage.setItem('@budget_categories', JSON.stringify(cats));
      await AsyncStorage.setItem('@budget_recurring', JSON.stringify(recs));
    } catch (e) {
      Alert.alert("Storage Failure", "Disk write write-lock execution exception.");
    }
  };

  useEffect(() => {
    const favorite = accounts.find(acc => acc.isFavorite);
    if (favorite) setSelectedAccountId(favorite.id);
    else if (accounts.length > 0 && !selectedAccountId) setSelectedAccountId(accounts[0].id);
  }, [accounts]);

  const handleCreateAccount = () => {
    if (!newAccountName || !newAccountBalance) return Alert.alert("Error", "Fill required configurations.");
    const updated = [...accounts, { id: Date.now().toString(), name: newAccountName, balance: parseFloat(newAccountBalance), isFavorite: accounts.length === 0 }];
    setAccounts(updated);
    syncCache(updated, transactions, categories, recurringTransactions);
    setNewAccountName('');
    setNewAccountBalance('');
  };

  const handleSetFavorite = (id) => {
    const updated = accounts.map(acc => ({ ...acc, isFavorite: acc.id === id }));
    setAccounts(updated);
    syncCache(updated, transactions, categories, recurringTransactions);
  };

  // Enhancement 4 Inflow vs Outflow logic update
  const handleLogTransaction = (isIncomingToggle, inputDescription) => {
    if (!expenseAmount || !expenseCategory || !selectedAccountId) return Alert.alert("Error", "Required fields missing.");
    const amountNum = parseFloat(expenseAmount);
    
    // Process math modifiers accurately based on toggle position
    const updatedAccs = accounts.map(a => {
      if (a.id === selectedAccountId) {
        return { ...a, balance: isIncomingToggle ? a.balance + amountNum : a.balance - amountNum };
      }
      return a;
    });

    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const newTx = { 
      id: Date.now().toString(), 
      accountId: selectedAccountId, 
      accountName: accounts.find(a => a.id === selectedAccountId)?.name, 
      amount: amountNum, 
      category: expenseCategory, 
      type: isIncomingToggle ? 'Inflow Credit' : 'Expense', 
      date: formattedDate,
      note: inputDescription ? inputDescription.trim() : null // Capture descriptive input notes
    };

    const updatedTxs = [newTx, ...transactions];
    setAccounts(updatedAccs);
    setTransactions(updatedTxs);
    syncCache(updatedAccs, updatedTxs, categories, recurringTransactions);
    setExpenseAmount('');
  };

  const handleApplyReconciliation = () => {
    const target = accounts.find(a => a.id === reconAccountId);
    const newBalNum = parseFloat(reconNewBalance);
    const diff = newBalNum - target.balance;
    if (diff === 0) return setReconModalVisible(false);

    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const updatedAccs = accounts.map(a => a.id === reconAccountId ? { ...a, balance: newBalNum } : a);
    const updatedTxs = [{ id: Date.now().toString(), accountId: reconAccountId, accountName: target.name, amount: Math.abs(diff), category: 'Manual Tweak', type: 'Balance Adjustment', date: formattedDate, note: diff > 0 ? "Adjusted Up" : "Adjusted Down" }, ...transactions];

    setAccounts(updatedAccs);
    setTransactions(updatedTxs);
    syncCache(updatedAccs, updatedTxs, categories, recurringTransactions);
    setReconNewBalance('');
    setReconModalVisible(false);
  };

  const handleDeleteAccount = (id) => {
    const target = accounts.find(a => a.id === id);
    if (!target) return;

    Alert.alert("Delete Account", `Remove ${target.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        const updatedAccs = accounts.filter(a => a.id !== id);
        if (target.isFavorite && updatedAccs.length > 0) updatedAccs[0].isFavorite = true;

        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const updatedTxs = [{ id: Date.now().toString(), accountId: id, accountName: target.name, amount: target.balance, category: "Account Deletion", type: "Balance Adjustment", date: formattedDate, note: "Adjusted Down (Deleted)" }, ...transactions];

        setAccounts(updatedAccs);
        setTransactions(updatedTxs);
        syncCache(updatedAccs, updatedTxs, categories, updatedTxs);
      }}
    ]);
  };

  // Enhancement 2 Taxonomy updates
  const handleAddCategory = (newCat) => {
    if (categories.includes(newCat)) return;
    const updated = [...categories, newCat];
    setCategories(updated);
    syncCache(accounts, transactions, updated, recurringTransactions);
  };

  const handleDeleteCategory = (catTarget) => {
    const updated = categories.filter(c => c !== catTarget);
    setCategories(updated);
    if (expenseCategory === catTarget && updated.length > 0) setExpenseCategory(updated[0]);
    syncCache(accounts, transactions, updated, recurringTransactions);
  };

  // Enhancement 5 & 6 Automation managers
  const handleAddRecurring = (newRecPayload) => {
    const updated = [{ id: Date.now().toString(), ...newRecPayload }, ...recurringTransactions];
    setRecurringTransactions(updated);
    syncCache(accounts, transactions, categories, updated);
    Alert.alert("Success", "Automation plan registered successfully!");
  };

  const handleDeleteRecurring = (targetId) => {
    const updated = recurringTransactions.filter(r => r.id !== targetId);
    setRecurringTransactions(updated);
    syncCache(accounts, transactions, categories, updated);
  };

  const totalFinancialResources = accounts.reduce((sum, acc) => sum + acc.balance, 0);
const handleDeleteTransaction = (txId) => {
    const targetTx = transactions.find(t => t.id === txId);
    if (!targetTx) return;

    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to permanently remove this transaction log? Your linked account balances will be restored to reflect this change.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // --- STATE RESTORATION ENGINE ---
            // Process reverse-mathematical modifications to return account states to baseline values
            const updatedAccs = accounts.map(acc => {
              if (acc.id === targetTx.accountId) {
                if (targetTx.type === 'Expense') {
                  // Add spent cash back into account balance
                  return { ...acc, balance: acc.balance + targetTx.amount };
                } else if (targetTx.type === 'Inflow Credit') {
                  // Subtract incoming cash credits from account balance
                  return { ...acc, balance: acc.balance - targetTx.amount };
                } else if (targetTx.type === 'Balance Adjustment') {
                  // Revert manual reconciliation tweaks
                  if (targetTx.note && targetTx.note.includes("Up")) {
                    return { ...acc, balance: acc.balance - targetTx.amount };
                  } else {
                    return { ...acc, balance: acc.balance + targetTx.amount };
                  }
                }
              }
              return acc;
            });

            // If the deleted transaction was an account deletion, we can't easily recreate the account structure
            // safely, so it handles the transaction line clean-up seamlessly.
            const updatedTxs = transactions.filter(t => t.id !== txId);

            setAccounts(updatedAccs);
            setTransactions(updatedTxs);
            syncCache(updatedAccs, updatedTxs, categories, recurringTransactions); // Persist safely to AsyncStorage
          }
        }
      ]
    );
  };
  return (
    <SafeAreaView style={theme.container}>
      <View style={theme.header}>
        <Text style={theme.headerTitle}>MiniBudget</Text>
        <Text style={theme.headerSubtitle}>Total Net Worth: ${totalFinancialResources.toFixed(2)}</Text>
      </View>

      <View style={theme.tabContainer}>
        {[
          { key: 'dashboard', label: 'Quick Log' },
          { key: 'accounts', label: 'Accounts' },
          { key: 'history', label: 'Summary' }
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[theme.tab, currentView === tab.key && theme.activeTab]} onPress={() => setCurrentView(tab.key)}>
            <Text style={[theme.tabText, currentView === tab.key && theme.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView ref={mainScrollRef} style={theme.content} contentContainerStyle={{ paddingBottom: 60 }} >
        {currentView === 'dashboard' && (
          <DashboardScreen 
            accounts={accounts} expenseAmount={expenseAmount} setExpenseAmount={setExpenseAmount}
            expenseCategory={expenseCategory} setExpenseCategory={setExpenseCategory}
            selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId}
            onLogTransaction={handleLogTransaction} categories={categories}
            recurringTransactions={recurringTransactions} onSaveRecurring={handleAddRecurring}
            onDeleteRecurring={handleDeleteRecurring} scrollRef={mainScrollRef}
          />
        )}
        {currentView === 'accounts' && (
          <AccountsScreen 
            accounts={accounts} newAccountName={newAccountName} setNewAccountName={setNewAccountName}
            newAccountBalance={newAccountBalance} setNewAccountBalance={setNewAccountBalance}
            onCreateAccount={handleCreateAccount} onSetFavorite={handleSetFavorite}
            onTriggerReconcile={(id) => { setReconAccountId(id); setReconModalVisible(true); }}
            onDeleteAccount={handleDeleteAccount} categories={categories}
            onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory}
          />
        )}
      {currentView === 'history' && (
                <SummaryScreen 
                  accounts={accounts} 
                  transactions={transactions} 
                  onDeleteTransaction={handleDeleteTransaction} 
                />
              )}
      </ScrollView>

      <ReconciliationModal 
        visible={reconModalVisible} setVisible={setReconModalVisible}
        balanceInput={reconNewBalance} setBalanceInput={setReconNewBalance} onApply={handleApplyReconciliation}
      />
    </SafeAreaView>
  );
}