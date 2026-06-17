// src/screens/Vault/useVaultState.js
import { useState } from 'react';
import { runYieldOptimization } from './utils/optimizerEngine';

export function useVaultState(accounts, outflowCategories, inflowCategories, onUpdateRecurring, onUpdateInterestRate) {
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
  const [recIsIncoming, setRecIsIncoming] = useState(false);

  // YIELD OPTIMIZER USER INPUT STATES
  const [hysaCapital, setHysaCapital] = useState('50000');
  const [lockAwayCapital, setLockAwayCapital] = useState('10000');
  const [lockDuration, setLockDuration] = useState(12);
  const [salaryInput, setSalaryInput] = useState('3500');
  const [allowInvestment, setAllowInvestment] = useState(true);
  const [allowInsurance, setAllowInsurance] = useState(true);
  
  const [isOptimizationRendered, setIsOptimizationResultVisible] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState([]);
  const [netAnnualEarnings, setNetAnnualEarnings] = useState(0);

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
    setRecIsIncoming(false);
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
    setRecIsIncoming(!!item.isIncoming);
    setIsEditRecModalVisible(true);
  };

  const handleCalculateOptimization = () => {
    const { allocations, totalInterest } = runYieldOptimization({
      hysaCapital, lockAwayCapital, lockDuration, salaryInput, allowInvestment, allowInsurance
    });
    setSimulatedResults(allocations);
    setNetAnnualEarnings(totalInterest);
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
    allowInsurance, setAllowInsurance,
    isOptimizationRendered, setIsOptimizationResultVisible,
    simulatedResults, netAnnualEarnings,
    triggerAccountEditingFlow, triggerNewAutomationFlow, triggerEditRecurringFlow,
    handleCalculateOptimization
  };
}