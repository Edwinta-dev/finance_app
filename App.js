// App.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, Alert, Linking, Platform } from 'react-native';

import { theme } from './src/styles/theme.js';
import { SummaryScreen } from './src/screens/SummaryScreen.js';
import { TransactionsScreen } from './src/screens/TransactionsScreen.js'; 
import { AccountsScreen } from './src/screens/AccountsScreen.js';
import { BudgetScreen } from './src/screens/BudgetScreen.js'; 
import { ReconciliationModal } from './src/components/ReconciliationModal.js';
import { QuickLogModal } from './src/components/QuickLogModal.js'; // FIXED: Imported our wrapping overlay component
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const mainScrollRef = React.useRef(null);

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // FIXED UI: Default home route landing view initialized to 'history' (Summary) as Quick Log is now modalized
  const [currentView, setCurrentView] = useState('history'); 
  
  // FIXED UI: Added interactive floating visibility switch state
  const [quickLogModalVisible, setQuickLogModalVisible] = useState(false);

  const [outflowCategories, setOutflowCategories] = useState(['Food', 'Transport', 'Groceries', 'Utilities', 'Personal', 'Miscellaneous', 'Health']);
  const [inflowCategories, setInflowCategories] = useState(['Salary', 'Investments', 'Bank Interest', 'Reimbursement', 'Side Hustle']);
  const [recurringTransactions, setRecurringTransactions] = useState([]);

  const [monthlyBudgets, setMonthlyBudgets] = useState({}); 
  const [envelopeAllocations, setEnvelopeAllocations] = useState({}); 

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  
  // Kept intact at the root layer to support deep-link string catch-up flows safely with zero regression
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food'); 
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  
  const [reconModalVisible, setReconModalVisible] = useState(false);
  const [reconAccountId, setReconAccountId] = useState(null);
  const [reconNewBalance, setReconNewBalance] = useState('');

  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) processIncomingDeepAction(url);
    });

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
        const standardizedCat = [...outflowCategories, ...inflowCategories].find(
          c => c.toLowerCase() === extractedCategory.toLowerCase().trim()
        );
        if (standardizedCat) setExpenseCategory(standardizedCat);
      }

      // FIXED UI: Automatically opens the entry overlay drawer when a deep link fires
      setQuickLogModalVisible(true);
      Alert.alert("Quick Launcher Active", `Staged $${extractedAmount} under ${extractedCategory} instantly inside log workspace.`);
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
      const storedBudgetsMap = await AsyncStorage.getItem('@budget_monthly_caps_map');
      const storedEnvelopes = await AsyncStorage.getItem('@budget_envelope_allocations');
      
      let parsedAccs = storedAccs ? JSON.parse(storedAccs) : [];
      let parsedTxs = storedTxs ? JSON.parse(storedTxs) : [];
      
      if (storedOutflowCats) setOutflowCategories(JSON.parse(storedOutflowCats));
      if (storedInflowCats) setInflowCategories(JSON.parse(storedInflowCats));
      if (storedRecs) setRecurringTransactions(JSON.parse(storedRecs));

      const today = new Date();
      const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      if (storedBudgetsMap) {
        setMonthlyBudgets(JSON.parse(storedBudgetsMap));
      } else {
        const legacyCap = await AsyncStorage.getItem('@budget_monthly_global_cap');
        setMonthlyBudgets({ [currentYearMonth]: legacyCap ? parseFloat(legacyCap) : 2000 });
      }

      if (storedEnvelopes) setEnvelopeAllocations(JSON.parse(storedEnvelopes));

      let interestCompoundedThisSession = false;
      let freshSystemTxs = [];

      parsedAccs = parsedAccs.map(acc => {
        const annualRatePA = acc.interestRate !== undefined ? acc.interestRate : 0.0;
        const lastCompoundedMarker = acc.lastInterestCompoundedMonth || '';

        if (annualRatePA > 0 && lastCompoundedMarker !== '' && lastCompoundedMarker !== currentYearMonth) {
          const monthlyYieldRate = annualRatePA / 100 / 12;
          const interestEarnedPayout = acc.balance * monthlyYieldRate;

          if (interestEarnedPayout > 0.005) {
            interestCompoundedThisSession = true;
            const adjustedBalance = acc.balance + interestEarnedPayout;
            const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            freshSystemTxs.push({
              id: `interest-${acc.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              accountId: acc.id,
              accountName: acc.name,
              amount: interestEarnedPayout,
              category: 'Bank Interest',
              type: 'Inflow Credit',
              date: formattedDate,
              note: `Automated Interest Compound (${annualRatePA}% P.A.)`
            });

            return {
              ...acc,
              balance: adjustedBalance,
              interestRate: annualRatePA,
              lastInterestCompoundedMonth: currentYearMonth
            };
          }
        }

        return {
          ...acc,
          interestRate: annualRatePA,
          lastInterestCompoundedMonth: acc.lastInterestCompoundedMonth || currentYearMonth
        };
      });

      if (interestCompoundedThisSession) {
        parsedTxs = [...freshSystemTxs, ...parsedTxs];
        Alert.alert("Interest Compounded", "New automated monthly interest earnings have been calculated and credited across your asset portfolios.");
      }

      setAccounts(parsedAccs);
      setTransactions(parsedTxs);

      if (parsedAccs.length > 0) {
        const favoriteAccount = parsedAccs.find(a => a.isFavorite);
        if (favoriteAccount) {
          setSelectedAccountId(favoriteAccount.id);
        } else {
          setSelectedAccountId(parsedAccs[0].id);
        }
      }
      
      await AsyncStorage.setItem('@budget_accounts', JSON.stringify(parsedAccs));
      await AsyncStorage.setItem('@budget_transactions', JSON.stringify(parsedTxs));
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
      Alert.alert("Storage Failure", "Disk write lock exception.");
    }
  };

  const syncEnvelopeCache = async (nextBudgetsMap, nextAllocationsObject) => {
    try {
      await AsyncStorage.setItem('@budget_monthly_caps_map', JSON.stringify(nextBudgetsMap));
      await AsyncStorage.setItem('@budget_envelope_allocations', JSON.stringify(nextAllocationsObject));
    } catch (e) {
      Alert.alert("Storage Failure", "Envelope partition write lock error.");
    }
  };

  const handleCreateAccount = () => {
    if (!newAccountName || !newAccountBalance) return Alert.alert("Error", "Fill required configurations.");
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const updated = [...accounts, { 
      id: Date.now().toString(), 
      name: newAccountName, 
      balance: parseFloat(newAccountBalance), 
      isFavorite: accounts.length === 0,
      interestRate: 0.0,
      lastInterestCompoundedMonth: currentYearMonth
    }];
    setAccounts(updated);
    syncCache(updated, transactions, outflowCategories, inflowCategories, recurringTransactions);
    setNewAccountName('');
    setNewAccountBalance('');
  };

  const handleSetFavorite = (id) => {
    const updated = accounts.map(acc => ({ ...acc, isFavorite: acc.id === id }));
    setAccounts(updated);
    setSelectedAccountId(id); 
    syncCache(updated, transactions, outflowCategories, inflowCategories, recurringTransactions);
  };

  const handleUpdateInterestRate = (accountId, configuredPercentagePA) => {
    const updated = accounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, interestRate: parseFloat(configuredPercentagePA) || 0.0 };
      }
      return acc;
    });
    setAccounts(updated);
    syncCache(updated, transactions, outflowCategories, inflowCategories, recurringTransactions);
  };

  const handleLogTransaction = (isIncomingToggle, inputDescription) => {
    if (!expenseAmount || !selectedAccountId) return Alert.alert("Error", "Required fields missing.");
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

  const handleEditTransaction = (txId, updatedAmount, updatedCategory, updatedDate, updatedNote) => {
    const oldTx = transactions.find(t => t.id === txId);
    if (!oldTx) return;

    const newAmountNum = parseFloat(updatedAmount);
    if (isNaN(newAmountNum) || newAmountNum < 0) return Alert.alert("Invalid Input", "Please provide a valid numeric value.");

    const updatedAccs = accounts.map(acc => {
      if (acc.id === oldTx.accountId) {
        let theoreticalRunningBalance = acc.balance;
        
        if (oldTx.type === 'Expense') theoreticalRunningBalance += oldTx.amount;
        else if (oldTx.type === 'Inflow Credit') theoreticalRunningBalance -= oldTx.amount;
        else if (oldTx.type === 'Balance Adjustment') {
          if (oldTx.note && oldTx.note.includes("Up")) theoreticalRunningBalance -= oldTx.amount;
          else theoreticalRunningBalance += oldTx.amount;
        }

        if (oldTx.type === 'Expense') theoreticalRunningBalance -= newAmountNum;
        else if (oldTx.type === 'Inflow Credit') theoreticalRunningBalance += newAmountNum;
        else if (oldTx.type === 'Balance Adjustment') {
          if (oldTx.note && oldTx.note.includes("Up")) theoreticalRunningBalance += newAmountNum;
          else theoreticalRunningBalance -= newAmountNum;
        }

        return { ...acc, balance: theoreticalRunningBalance };
      }
      return acc;
    });

    const updatedTxs = transactions.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          amount: newAmountNum,
          category: updatedCategory,
          date: updatedDate.trim(),
          note: updatedNote && updatedNote.trim() !== '' ? updatedNote.trim() : null
        };
      }
      return t;
    });

    setAccounts(updatedAccs);
    setTransactions(updatedTxs);
    syncCache(updatedAccs, updatedTxs, outflowCategories, inflowCategories, recurringTransactions);
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
    Alert.alert("Success", "Automation rule registered successfully!");
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

      {/* MAIN DATA MODULE VIEWPORTS CONTAINER PANEL */}
      {/* FIXED UI: Added extra padding at the bottom of the scroll track to prevent content from being covered by the navigation bar */}
      <ScrollView 
        ref={mainScrollRef} 
        style={theme.content} 
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 110 : 95 }} 
        keyboardShouldPersistTaps="handled"
      >
        {currentView === 'history' && (
          <SummaryScreen accounts={accounts} transactions={transactions} recurringTransactions={recurringTransactions} />
        )}
        {currentView === 'budget' && (
          <BudgetScreen 
            outflowCategories={outflowCategories} transactions={transactions}
            monthlyBudgets={monthlyBudgets} setMonthlyBudgets={setMonthlyBudgets} 
            envelopeAllocations={envelopeAllocations} setEnvelopeAllocations={setEnvelopeAllocations}
            onSaveCache={syncEnvelopeCache} scrollRef={mainScrollRef}
          />
        )}
        {currentView === 'transactions' && (
          <TransactionsScreen 
            accounts={accounts} transactions={transactions} 
            onDeleteTransaction={handleDeleteTransaction} onEditTransaction={handleEditTransaction} 
            outflowCategories={outflowCategories} inflowCategories={inflowCategories} 
          />
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
            onUpdateInterestRate={handleUpdateInterestRate} scrollRef={mainScrollRef} 
          />
        )}
      </ScrollView>

      {/* FIXED UI: REACTIVE BOTTOM-RIGHT INTERACTIVE FAB SWITCHER */}
      <TouchableOpacity 
        style={[theme.fabButton, quickLogModalVisible && theme.fabButtonActive]}
        activeOpacity={0.855}
        onPress={() => setQuickLogModalVisible(!quickLogModalVisible)}
      >
        <Text style={theme.fabButtonText}>
          {quickLogModalVisible ? '−' : '+'}
        </Text>
      </TouchableOpacity>

      {/* FIXED UI: TRANSLUCENT FIXED BOTTOM BAR NAVIGATION DECK */}
      <View style={theme.bottomTabBar}>
        {[
          { key: 'history', label: 'Summary', icon: '📊' },
          { key: 'budget', label: 'Budget', icon: '✉️' },
          { key: 'transactions', label: 'Ledger', icon: '📝' },
          { key: 'accounts', label: 'Vault', icon: '💳' }
        ].map(tab => {
          const isTabActive = currentView === tab.key;
          return (
            <TouchableOpacity 
              key={tab.key} 
              style={theme.bottomTabTab} 
              activeOpacity={0.7}
              onPress={() => setCurrentView(tab.key)}
            >
              <Text style={[theme.bottomTabIconPlaceholder, { opacity: isTabActive ? 1.0 : 0.5 }]}>
                {tab.icon}
              </Text>
              <Text style={[theme.bottomTabText, isTabActive && theme.activeBottomTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* GLOBAL MODALS AND OVERLAYS LAYER */}
      <QuickLogModal 
        visible={quickLogModalVisible}
        setVisible={setQuickLogModalVisible}
        accounts={accounts}
        outflowCategories={outflowCategories}
        inflowCategories={inflowCategories}
        expenseAmount={expenseAmount}
        setExpenseAmount={setExpenseAmount}
        expenseCategory={expenseCategory}
        setExpenseCategory={setExpenseCategory}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        onLogTransaction={handleLogTransaction}
        onSaveRecurring={handleAddRecurring}
      />

      <ReconciliationModal 
        visible={reconModalVisible} setVisible={setReconModalVisible}
        balanceInput={reconNewBalance} setBalanceInput={setReconNewBalance} onApply={handleApplyReconciliation}
      />
    </SafeAreaView>
  );
}
