// App.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';

import { theme } from './src/styles/theme.js';
import { DashboardScreen } from './src/screens/DashboardScreen.js';
import { SummaryScreen } from './src/screens/SummaryScreen.js';
import { TransactionsScreen } from './src/screens/TransactionsScreen.js'; 
import { AccountsScreen } from './src/screens/AccountsScreen.js';
import { ReconciliationModal } from './src/components/ReconciliationModal.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const mainScrollRef = React.useRef(null);

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // FIXED: Split unified categories array into distinct Outflow and Inflow state collections
  const [outflowCategories, setOutflowCategories] = useState(['Food', 'Transport', 'Groceries', 'Utilities', 'Personal', 'Miscellaneous', 'Health']);
  const [inflowCategories, setInflowCategories] = useState(['Salary', 'Investments', 'Bank Interest', 'Reimbursement', 'Side Hustle']);
  const [recurringTransactions, setRecurringTransactions] = useState([]);

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food'); 
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [reconModalVisible, setReconModalVisible] = useState(false);
  const [reconAccountId, setReconAccountId] = useState(null);
  const [reconNewBalance, setReconNewBalance] = useState('');

  useEffect(() => {
    // Intercept cold-start link triggers
    Linking.getInitialURL().then(url => {
      if (url) processIncomingDeepAction(url);
    });

    // Intercept background wake-up links
    const urlSubscription = Linking.addEventListener('url', (event) => {
      if (event.url) processIncomingDeepAction(event.url);
    });

    return () => {
      urlSubscription.remove();
    };
  }, [outflowCategories, inflowCategories]);

  const processIncomingDeepAction = (url) => {
    try {
      if (!url || !url.includes('://log')) return;
      const splitUrlParts = url.split('?');
      const queryParametersString = splitUrlParts[1];
      if (!queryParametersString) return;

      const argumentPairs = queryParametersString.split('&');
      let extractedAmount = '';
      let extractedCategory = '';

      argumentPairs.forEach(paramPair => {
        const [key, value] = paramPair.split('=');
        if (key === 'amount') extractedAmount = decodeURIComponent(value);
        if (key === 'category') extractedCategory = decodeURIComponent(value);
      });

      if (extractedAmount && !isNaN(extractedAmount)) {
        setExpenseAmount(extractedAmount);
      }
      
      if (extractedCategory) {
        // Fallback search checks both split branches cleanly
        const standardizedCat = [...outflowCategories, ...inflowCategories].find(
          c => c.toLowerCase() === extractedCategory.toLowerCase().trim()
        );
        if (standardizedCat) setExpenseCategory(standardizedCat);
      }

      setCurrentView('dashboard');
      Alert.alert("Quick Launcher Active", `Staged $${extractedAmount} under ${extractedCategory} instantly.`);
    } catch (err) {
      console.log("Deep link parsing error context: ", err);
    }
  };

  useEffect(() => {
    loadGlobalState();
  }, []);

  const loadGlobalState = async () => {
    try {
      const storedAccs = await AsyncStorage.getItem('@budget_accounts');
      const storedTxs = await AsyncStorage.getItem('@budget_transactions');
      const storedOutflowCats = await AsyncStorage.getItem('@budget_outflow_categories');
      const storedInflowCats = await AsyncStorage.getItem('@budget_inflow_categories');
      const storedRecs = await AsyncStorage.getItem('@budget_recurring');
      
      if (storedAccs) setAccounts(JSON.parse(storedAccs));
      if (storedTxs) setTransactions(JSON.parse(storedTxs));
      if (storedOutflowCats) setOutflowCategories(JSON.parse(storedOutflowCats));
      if (storedInflowCats) setInflowCategories(JSON.parse(storedInflowCats));
      if (storedRecs) setRecurringTransactions(JSON.parse(storedRecs));
    } catch (e) {
      Alert.alert("Data Failure", "Failed to resolve device persistent file mapping logs.");
    }
  };

  const syncCache = async (accs, txs, outCats, inCats, recs) => {
    try {
      await AsyncStorage.setItem('@budget_accounts', JSON.stringify(accs));
      await AsyncStorage.setItem('@budget_transactions', JSON.stringify(txs));
      await AsyncStorage.setItem('@budget_outflow_categories', JSON.stringify(outCats));
      await AsyncStorage.setItem('@budget_inflow_categories', JSON.stringify(inCats));
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
    syncCache(updated, transactions, outflowCategories, inflowCategories, recurringTransactions);
    setNewAccountName('');
    setNewAccountBalance('');
  };

  const handleSetFavorite = (id) => {
    const updated = accounts.map(acc => ({ ...acc, isFavorite: acc.id === id }));
    setAccounts(updated);
    syncCache(updated, transactions, outflowCategories, inflowCategories, recurringTransactions);
  };

  const handleLogTransaction = (isIncomingToggle, inputDescription) => {
    if (!expenseAmount || !expenseCategory || !selectedAccountId) return Alert.alert("Error", "Required fields missing.");
    const amountNum = parseFloat(expenseAmount);
    
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
      note: inputDescription ? inputDescription.trim() : null 
    };

    const updatedTxs = [newTx, ...transactions];
    setAccounts(updatedAccs);
    setTransactions(updatedTxs);
    syncCache(updatedAccs, updatedTxs, outflowCategories, inflowCategories, recurringTransactions);
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
    syncCache(updatedAccs, updatedTxs, outflowCategories, inflowCategories, recurringTransactions);
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
        syncCache(updatedAccs, updatedTxs, outflowCategories, inflowCategories, recurringTransactions);
      }}
    ]);
  };

  // FIXED: Added decoupled handlers for separate outflow vs inflow list operations
  const handleAddOutflowCategory = (newCat) => {
    if (outflowCategories.includes(newCat)) return;
    const updated = [...outflowCategories, newCat];
    setOutflowCategories(updated);
    syncCache(accounts, transactions, updated, inflowCategories, recurringTransactions);
  };

  const handleDeleteOutflowCategory = (catTarget) => {
    const updated = outflowCategories.filter(c => c !== catTarget);
    setOutflowCategories(updated);
    if (expenseCategory === catTarget && updated.length > 0) setExpenseCategory(updated[0]);
    syncCache(accounts, transactions, updated, inflowCategories, recurringTransactions);
  };

  const handleAddInflowCategory = (newCat) => {
    if (inflowCategories.includes(newCat)) return;
    const updated = [...inflowCategories, newCat];
    setInflowCategories(updated);
    syncCache(accounts, transactions, outflowCategories, updated, recurringTransactions);
  };

  const handleDeleteInflowCategory = (catTarget) => {
    const updated = inflowCategories.filter(c => c !== catTarget);
    setInflowCategories(updated);
    if (expenseCategory === catTarget && updated.length > 0) setExpenseCategory(updated[0]);
    syncCache(accounts, transactions, outflowCategories, updated, recurringTransactions);
  };

  const handleAddRecurring = (newRecPayload) => {
    const updated = [{ id: Date.now().toString(), ...newRecPayload }, ...recurringTransactions];
    setRecurringTransactions(updated);
    syncCache(accounts, transactions, outflowCategories, inflowCategories, updated);
    Alert.alert("Success", "Automation plan registered successfully!");
  };

  const handleDeleteRecurring = (targetId) => {
    const updated = recurringTransactions.filter(r => r.id !== targetId);
    setRecurringTransactions(updated);
    syncCache(accounts, transactions, outflowCategories, inflowCategories, updated);
  };

  const handleDeleteTransaction = (txId) => {
    const targetTx = transactions.find(t => t.id === txId);
    if (!targetTx) return;

    Alert.alert("Delete Transaction", "Permanently remove this log record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
        const updatedAccs = accounts.map(acc => {
          if (acc.id === targetTx.accountId) {
            if (targetTx.type === 'Expense') return { ...acc, balance: acc.balance + targetTx.amount };
            if (targetTx.type === 'Inflow Credit') return { ...acc, balance: acc.balance - targetTx.amount };
            if (targetTx.type === 'Balance Adjustment') {
              if (targetTx.note && targetTx.note.includes("Up")) return { ...acc, balance: acc.balance - targetTx.amount };
              else return { ...acc, balance: acc.balance + targetTx.amount };
            }
          }
          return acc;
        });

        const updatedTxs = transactions.filter(t => t.id !== txId);
        setAccounts(updatedAccs);
        setTransactions(updatedTxs);
        syncCache(updatedAccs, updatedTxs, outflowCategories, inflowCategories, recurringTransactions);
      }}
    ]);
  };

  const totalFinancialResources = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <SafeAreaView style={theme.container}>
      <View style={theme.header}>
        <Text style={theme.headerTitle}>MiniBudget</Text>
        <Text style={theme.headerSubtitle}>Total Net Worth: ${totalFinancialResources.toFixed(2)}</Text>
      </View>

      <View style={theme.tabScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={theme.tabContainer}>
          {[
            { key: 'dashboard', label: 'Quick Log' },
            { key: 'history', label: 'Summary' },
            { key: 'transactions', label: 'Transactions' }, 
            { key: 'accounts', label: 'Accounts' }
          ].map(tab => (
            <TouchableOpacity key={tab.key} style={[theme.tab, currentView === tab.key && theme.activeTab]} onPress={() => setCurrentView(tab.key)}>
              <Text style={[theme.tabText, currentView === tab.key && theme.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView ref={mainScrollRef} style={theme.content} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {currentView === 'dashboard' && (
          <DashboardScreen 
            accounts={accounts} expenseAmount={expenseAmount} setExpenseAmount={setExpenseAmount}
            expenseCategory={expenseCategory} setExpenseCategory={setExpenseCategory}
            selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId}
            onLogTransaction={handleLogTransaction} 
            outflowCategories={outflowCategories} inflowCategories={inflowCategories} // Split injection
            recurringTransactions={recurringTransactions} onSaveRecurring={handleAddRecurring}
            onDeleteRecurring={handleDeleteRecurring} scrollRef={mainScrollRef}
          />
        )}
        {currentView === 'history' && (
          <SummaryScreen accounts={accounts} transactions={transactions} />
        )}
        {currentView === 'transactions' && (
          <TransactionsScreen accounts={accounts} transactions={transactions} onDeleteTransaction={handleDeleteTransaction} />
        )}
        {currentView === 'accounts' && (
                  <AccountsScreen 
                    accounts={accounts} newAccountName={newAccountName} setNewAccountName={setNewAccountName}
                    newAccountBalance={newAccountBalance} setNewAccountBalance={setNewAccountBalance}
                    onCreateAccount={handleCreateAccount} onSetFavorite={handleSetFavorite}
                    onTriggerReconcile={(id) => { setReconAccountId(id); setReconModalVisible(true); }}
                    onDeleteAccount={handleDeleteAccount} 
                    outflowCategories={outflowCategories} inflowCategories={inflowCategories}
                    onAddOutflowCategory={handleAddOutflowCategory} onDeleteOutflowCategory={handleDeleteOutflowCategory}
                    onAddInflowCategory={handleAddInflowCategory} onDeleteInflowCategory={handleDeleteInflowCategory}
                    scrollRef={mainScrollRef} // Aligned here to allow inside component auto-scrolling
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