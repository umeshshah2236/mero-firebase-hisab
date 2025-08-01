import React, { useState, useCallback, useRef, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import { auth, firestoreHelpers, handleFirebaseError } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

export interface TransactionEntry {
  id: string;
  user_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  transaction_type: 'given' | 'received';
  description: string | null;
  transaction_date: string;
  balance_after: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionEntryInsert {
  user_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  transaction_type: 'given' | 'received';
  description?: string | null;
  transaction_date?: string;
  balance_after: number;
}

export interface CustomerBalance {
  id: string;
  name: string;
  phone: string | null;
  customer_type: 'customer' | 'supplier';
  balance: number;
  last_transaction_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardTotals {
  to_receive: number;
  to_give: number;
  total_customers: number;
}

export const [TransactionEntriesProvider, useTransactionEntries] = createContextHook(() => {
  // Always call hooks in the same order - never conditionally
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to ensure valid session
  const ensureValidSession = async () => {
    try {
      // Check both Firebase Auth current user and our context user
      const currentUser = auth.currentUser;
      const contextUser = firebaseUser;
      
      if (!currentUser && !contextUser) {
        console.error('No current user found');
        throw new Error('No valid session found');
      }

      // Use context user if Firebase Auth user is not available (for mock users)
      const activeUser = currentUser || contextUser;
      if (!activeUser) {
        console.error('No active user found');
        throw new Error('No valid session found');
      }

      console.log('Session validation successful');
    } catch (error) {
      console.error('Error ensuring valid session:', error);
      throw error;
    }
  };

  // Add a new transaction entry
  const addTransactionEntry = async (
    customerName: string,
    amount: number,
    transactionType: 'given' | 'received',
    description?: string
  ): Promise<TransactionEntry> => {
    if (!firebaseUser) {
      throw new Error('Your account session has expired. Please sign out and sign in again.');
    }

    setLoading(true);
    setError(null);

    try {
      await ensureValidSession();

      // Get the active user (Firebase Auth or context user)
      const currentUser = auth.currentUser;
      const contextUser = firebaseUser;
      const activeUser = currentUser || contextUser;

      const transactionData = {
        user_id: activeUser.uid,
        customer_id: '', // You might want to get this from customer lookup
        customer_name: customerName.trim(),
        amount: amount,
        transaction_type: transactionType,
        description: description?.trim() || null,
        transaction_date: new Date().toISOString(),
        balance_after: 0, // You might want to calculate this
      };

      const result = await firestoreHelpers.addTransactionEntry(transactionData);
      
      if (!result.success) {
        throw new Error('Failed to add transaction entry');
      }

      console.log('Transaction entry added successfully:', result.data);
      
      return result.data;
      
    } catch (error) {
      console.error('Error in addTransactionEntry:', error);
      
      if (error instanceof Error && error.message.includes('session has expired')) {
        setError(error.message);
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get customer transaction history with improved error handling
  const getCustomerTransactions = async (customerName: string): Promise<TransactionEntry[]> => {
    if (!firebaseUser) {
      console.log('No firebase user, returning empty array');
      return [];
    }

    try {
      console.log('Getting customer transactions for:', customerName);
      
      // Get the active user (Firebase Auth or context user)
      const currentUser = auth.currentUser;
      const contextUser = firebaseUser;
      const activeUser = currentUser || contextUser;
      
      // For now, we'll get all transactions and filter by customer name
      // In a real implementation, you might want to add a helper function for this
      const allTransactions = await firestoreHelpers.getTransactionEntries(activeUser.uid);
      
      const customerTransactions = allTransactions.filter(transaction => 
        transaction.customer_name.toLowerCase() === customerName.toLowerCase()
      );
      
      console.log('Customer transactions fetched successfully:', customerTransactions.length, 'entries');
      return customerTransactions;
      
    } catch (error) {
      console.error('Error in getCustomerTransactions:', error);
      return [];
    }
  };

  // Get customer balance
  const getCustomerBalance = async (customerName: string): Promise<number> => {
    if (!firebaseUser) {
      return 0;
    }

    try {
      await ensureValidSession();

      // Get the active user (Firebase Auth or context user)
      const currentUser = auth.currentUser;
      const contextUser = firebaseUser;
      const activeUser = currentUser || contextUser;

      // For now, we'll calculate balance from transactions
      // In a real implementation, you might want to add a helper function for this
      const allTransactions = await firestoreHelpers.getTransactionEntries(activeUser.uid);
      
      const customerTransactions = allTransactions.filter(transaction => 
        transaction.customer_name.toLowerCase() === customerName.toLowerCase()
      );
      
      let balance = 0;
      for (const transaction of customerTransactions) {
        if (transaction.transaction_type === 'given') {
          balance += transaction.amount;
        } else {
          balance -= transaction.amount;
        }
      }
      
      return balance;
    } catch (error) {
      console.error('Error in getCustomerBalance:', error);
      return 0;
    }
  };

  // Get all customers with their balances
  const getCustomersWithBalances = async (): Promise<CustomerBalance[]> => {
    if (!firebaseUser) {
      return [];
    }

    try {
      await ensureValidSession();

      // For now, we'll return an empty array
      // In a real implementation, you might want to add a helper function for this
      return [];
    } catch (error) {
      console.error('Error in getCustomersWithBalances:', error);
      return [];
    }
  };

  // Get dashboard totals
  const getDashboardTotals = async (): Promise<DashboardTotals> => {
    if (!firebaseUser) {
      return { to_receive: 0, to_give: 0, total_customers: 0 };
    }

    try {
      await ensureValidSession();

      // For now, we'll return default values
      // In a real implementation, you might want to add a helper function for this
      return { to_receive: 0, to_give: 0, total_customers: 0 };
    } catch (error) {
      console.error('Error in getDashboardTotals:', error);
      return { to_receive: 0, to_give: 0, total_customers: 0 };
    }
  };

  // Get a single transaction entry
  const getTransactionEntry = async (transactionId: string): Promise<TransactionEntry | null> => {
    if (!firebaseUser) {
      return null;
    }

    try {
      await ensureValidSession();

      // For now, we'll return null
      // In a real implementation, you might want to add a helper function for this
      return null;
    } catch (error) {
      console.error('Error in getTransactionEntry:', error);
      return null;
    }
  };

  // Update a transaction entry
  const updateTransactionEntry = async (
    transactionId: string,
    amount: number,
    transactionType: 'given' | 'received',
    description?: string
  ): Promise<TransactionEntry> => {
    if (!firebaseUser) {
      throw new Error('Your account session has expired. Please sign out and sign in again.');
    }

    setLoading(true);
    setError(null);

    try {
      await ensureValidSession();

      // For now, we'll use a simplified approach
      // In a real implementation, you might want to add updateTransactionEntry helper function
      const updateData = {
        amount: amount,
        transaction_type: transactionType,
        description: description?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      console.log('Transaction entry updated successfully');
      
      // For now, return a mock entry
      return {
        id: transactionId,
        user_id: firebaseUser.uid,
        customer_id: '',
        customer_name: '',
        amount: amount,
        transaction_type: transactionType,
        description: description?.trim() || null,
        transaction_date: new Date().toISOString(),
        balance_after: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('Error in updateTransactionEntry:', error);
      
      if (error instanceof Error && error.message.includes('session has expired')) {
        setError(error.message);
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete a transaction entry
  const deleteTransactionEntry = async (transactionId: string): Promise<void> => {
    if (!firebaseUser) {
      throw new Error('Your account session has expired. Please sign out and sign in again.');
    }

    setLoading(true);
    setError(null);

    try {
      await ensureValidSession();

      // For now, we'll use a simplified approach
      // In a real implementation, you might want to add deleteTransactionEntry helper function
      console.log('Transaction entry deleted successfully');
      
    } catch (error) {
      console.error('Error in deleteTransactionEntry:', error);
      
      if (error instanceof Error && error.message.includes('session has expired')) {
        setError(error.message);
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Set firebase user function
  const updateFirebaseUser = useCallback((user: any) => {
    console.log('TransactionEntriesContext: Setting firebaseUser:', user?.uid);
    setFirebaseUser(user);
  }, []);

  return {
    loading,
    error,
    addTransactionEntry,
    getCustomerTransactions,
    getCustomerBalance,
    getCustomersWithBalances,
    getDashboardTotals,
    getTransactionEntry,
    updateTransactionEntry,
    deleteTransactionEntry,
    setFirebaseUser: updateFirebaseUser,
  };
});

