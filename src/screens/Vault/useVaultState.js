// src/screens/Vault/useVaultState.js
import { useState } from 'react';
import { Alert } from 'react-native';
import { runYieldOptimization } from './utils/optimizerEngine';
import { parsePositiveMoney } from '../../utils/validation';

export function useVaultState({
  accounts, outflowCategories, inflowCategories,
  onUpdateRecurring, onDeleteRecurring, onAddRecurring,
  onAddOutflowCategory, onAddInflowCategory
}) {
  const [activeTab, setActiveTab] = useState('assets');
  const [isAddAccountModalVisible, setIsAddAccountModalVisible] = useState(false);
  const [categoryMode, setCategoryType] = useState('outflow'); 
  const [typedCategoryName, setTypedCategoryName] = useState('');
  
  // NEW PARAMETERS FOR UNIFIED ACCOUNT MANAGEMENT FLOWS
  const [newAccountInterest, setNewAccountInterest] = useState('');
  const [isEditAccountModalVisible, setIsEditAccountModalVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [editingAccountName, setEditingAccountName] = useState('');
  const [editingAccountBalance, setEditingAccountBalance] = useState('');
  const [editingAccountInterest, setEditingAccountInterest] = useState('');

  // AUTOMATIONS CONFIG STATES
  const [isAddingAutomation, setIsAddingAutomation] = useState(false);
  const [isEditRecModalVisible, setIsEditRecModalVisible] = useState(false);
  const [selectedRecId, setSelectedRecId] = useState(null);
  
  // Shared Automation Form State Elements
  const [recLabel, setRecLabel] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState('');
  const [recFrequency, setRecFrequency] = useState('Monthly');
  const [recAccountId, setRecAccountId] = useState('');
  const [recIsIncoming, setRecIsIncomingRaw] = useState(false);

  // YIELD OPTIMIZER USER INPUT STATES
  const [hysaCapital, setHysaCapital] = useState('50000');
  const [lockAwayCapital, setLockAwayCapital] = useState('10000');
  const [lockDuration, setLockDuration] = useState(12);
  const [salaryInput, setSalaryInput] = useState('3500');
  const [allowInvestment, setAllowInvestment] = useState(true);
  
  const [isOptimizationRendered, setIsOptimizationResultVisible] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState([]);
  const [netAnnualEarnings, setNetAnnualEarnings] = useState(0);
  const [unallocatedCapital, setUnallocatedCapital] = useState(0);

  // Switching direction swaps the category list, so reset the category to a valid one.
  const setRecIsIncoming = (isIncoming) => {
    setRecIsIncomingRaw(isIncoming);
    setRecCategory((isIncoming ? inflowCategories : outflowCategories)[0] || '');
  };

  const triggerAccountEditingFlow = (acc) => {
    setSelectedAccountId(acc.id);
    setEditingAccountName(acc.name || '');
    setEditingAccountBalance(String(acc.balance || '0.00'));
    setEditingAccountInterest(acc.interestRate !== undefined ? String(acc.interestRate) : '0.0');
    setIsEditAccountModalVisible(true);
  };

  const triggerNewAutomationFlow = () => {
    setSelectedRecId(null);
    setRecLabel('');
    setRecAmount('');
    setRecIsIncomingRaw(false);
    setRecFrequency('Monthly');
    setRecAccountId(accounts[0]?.id || '');
    setRecCategory(outflowCategories[0] || '');
    setIsAddingAutomation(true);
  };

  const triggerEditRecurringFlow = (item) => {
    setSelectedRecId(item.id);
    setRecLabel(item.label || '');
    setRecAmount(String(item.amount || ''));
    setRecCategory(item.category || '');
    setRecFrequency(item.frequency || 'Monthly');
    setRecAccountId(item.accountId || accounts[0]?.id || '');
    setRecIsIncomingRaw(!!item.isIncoming);
    setIsEditRecModalVisible(true);
  };

  // isEdit=false creates a new rule, isEdit=true saves the rule opened in the edit modal.
  const executeSaveAutomationSubmit = (isEdit) => {
    const amount = parsePositiveMoney(recAmount);
    if (amount === null) return Alert.alert("Invalid Amount", "Enter an amount greater than zero.");
    if (!recAccountId) return Alert.alert("No Account", "Pick the account this rule applies to.");
    const payload = {
      label: recLabel.trim() || 'Unnamed Plan',
      amount,
      category: recCategory,
      frequency: recFrequency,
      accountId: recAccountId,
      isIncoming: recIsIncoming
    };
    if (isEdit) {
      if (!selectedRecId) return;
      onUpdateRecurring(selectedRecId, payload);
      setIsEditRecModalVisible(false);
      setSelectedRecId(null);
    } else {
      onAddRecurring(payload);
      setIsAddingAutomation(false);
    }
  };

  const executeDeleteRecurring = () => {
    if (!selectedRecId) return;
    Alert.alert("Delete Rule", "Remove this automation rule? Past transactions it created are kept.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        onDeleteRecurring(selectedRecId);
        setIsEditRecModalVisible(false);
        setSelectedRecId(null);
      }}
    ]);
  };

  const executeCategorySubmit = () => {
    const name = typedCategoryName.trim();
    if (!name) return;
    const list = categoryMode === 'outflow' ? outflowCategories : inflowCategories;
    if (list.some(c => c.toLowerCase() === name.toLowerCase())) {
      return Alert.alert("Duplicate", `"${name}" already exists.`);
    }
    if (categoryMode === 'outflow') onAddOutflowCategory(name);
    else onAddInflowCategory(name);
    setTypedCategoryName('');
  };

  const handleCalculateOptimization = () => {
    const { allocations, totalInterest, unallocated } = runYieldOptimization({
      hysaCapital, lockAwayCapital, lockDuration, salaryInput, allowInvestment
    });
    setSimulatedResults(allocations);
    setNetAnnualEarnings(totalInterest);
    setUnallocatedCapital(unallocated);
    setIsOptimizationResultVisible(true);
  };

  return {
    activeTab, setActiveTab,
    isAddAccountModalVisible, setIsAddAccountModalVisible,
    categoryMode, setCategoryType,
    typedCategoryName, setTypedCategoryName,
    newAccountInterest, setNewAccountInterest,
    isEditAccountModalVisible, setIsEditAccountModalVisible,
    selectedAccountId, setSelectedAccountId,
    editingAccountName, setEditingAccountName,
    editingAccountBalance, setEditingAccountBalance,
    editingAccountInterest, setEditingAccountInterest,
    isAddingAutomation, setIsAddingAutomation,
    isEditRecModalVisible, setIsEditRecModalVisible,
    selectedRecId, setSelectedRecId,
    recLabel, setRecLabel,
    recAmount, setRecAmount,
    recCategory, setRecCategory,
    recFrequency, setRecFrequency,
    recAccountId, setRecAccountId,
    recIsIncoming, setRecIsIncoming,
    hysaCapital, setHysaCapital,
    lockAwayCapital, setLockAwayCapital,
    lockDuration, setLockDuration,
    salaryInput, setSalaryInput,
    allowInvestment, setAllowInvestment,
    isOptimizationRendered, setIsOptimizationResultVisible,
    simulatedResults, netAnnualEarnings, unallocatedCapital,
    triggerAccountEditingFlow, triggerNewAutomationFlow, triggerEditRecurringFlow,
    executeSaveAutomationSubmit, executeDeleteRecurring, executeCategorySubmit,
    handleCalculateOptimization
  };
}