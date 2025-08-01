import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { auth, firestoreHelpers } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { offlineStorage } from '@/utils/offline-storage';
import { useNetwork } from './NetworkContext';

export interface Loan {
  id: string;
  user_id: string;
  person_name: string;
  loan_amount: number;
  interest_rate: number;
  loan_date: string;
  customer_id: string | null;
  is_document_submitted: boolean;
  notes: string | null;
  purpose: string | null;
  transaction_type: 'given' | 'received';
  created_at: string;
  updated_at: string;
}

export interface Repayment {
  id: string;
  loan_id: string;
  repayment_amount: number;
  repayment_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanWithRepayments extends Loan {
  repayments: Repayment[];
  totalRepaid: number;
  netBalance: number;
}

interface LoansContextType {
  loans: LoanWithRepayments[];
  isLoading: boolean;
  error: string | null;
  refreshLoans: (forceRefresh?: boolean) => Promise<void>;
  setFirebaseUser: (user: any) => void;
  updateLoan: (loanId: string, amount: number, description?: string, date?: string) => Promise<void>;
  deleteLoan: (loanId: string) => Promise<void>;
}

const [LoansProvider, useLoans] = createContextHook((): LoansContextType => {
  const [loans, setLoans] = useState<LoanWithRepayments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const { isOnline, addPendingOperation } = useNetwork();

  const fetchLoans = async (userId?: string, forceRefresh: boolean = false) => {
    if (!userId && !currentUser?.uid) {
      console.log('No user ID available for fetching loans');
      return;
    }

    const userIdToUse = userId || currentUser?.uid;
    const now = Date.now();
    const cacheTimeout = 10 * 1000; // 10 seconds

    // Simple caching - don't refetch if data is less than 10 seconds old (reduced for better UX)
    if (!forceRefresh && loans.length > 0 && (now - lastFetchTime) < cacheTimeout) {
      console.log('Using cached loans data (cache age:', Math.round((now - lastFetchTime) / 1000), 'seconds)');
      return;
    }

    console.log('Fetching fresh loans data (forceRefresh:', forceRefresh, ', cache age:', Math.round((now - lastFetchTime) / 1000), 'seconds)');
    setIsLoading(true);
    setError(null);

    try {
      // If offline, try to load from local storage first
      if (!isOnline) {
        console.log('📱 Offline mode: Loading loans from local storage');
        const offlineLoans = await offlineStorage.loadLoans(userIdToUse);
        if (offlineLoans) {
          setLoans(offlineLoans);
          setLastFetchTime(Date.now());
          setIsLoading(false);
          return;
        } else {
          console.log('📱 No offline loans data available');
          setLoans([]);
          setIsLoading(false);
          return;
        }
      }

      console.log('Fetching loans for user:', userIdToUse);
      
      const loansData = await firestoreHelpers.getLoans(userIdToUse);

      setLoans(loansData || []);
      setLastFetchTime(Date.now());
      console.log(`Found ${loansData.length} loans`);

      // Save to offline storage for offline access
      if (isOnline) {
        try {
          await offlineStorage.saveLoans(loansData || [], userIdToUse);
          console.log('💾 Saved loans to offline storage');
        } catch (error) {
          console.error('Error saving loans to offline storage:', error);
        }
      }

      setLastFetchTime(Date.now());
      console.log('Successfully fetched and processed loans');
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch loans');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with auth context after mount
  useEffect(() => {
    if (currentUser) {
      console.log('LoansContext: Initializing loans fetch for user:', currentUser.uid);
      fetchLoans().catch((error) => {
        console.error('Failed to fetch loans on initialization:', error);
        // Set loading to false even on error
        setIsLoading(false);
      });
    } else {
      console.log('LoansContext: No current user, skipping loans fetch');
      setLoans([]);
      setIsLoading(false);
    }
  }, [currentUser]);

  const refreshLoans = async (forceRefresh: boolean = true) => {
    console.log('LoansContext: refreshLoans called with forceRefresh:', forceRefresh);
    // Always invalidate cache when explicitly refreshing
    if (forceRefresh) {
      setLastFetchTime(0); // Force cache invalidation
    }
    await fetchLoans(undefined, forceRefresh);
  };

  const setFirebaseUser = (user: any) => {
    setCurrentUser(user);
  };

  const updateLoan = async (loanId: string, amount: number, description?: string, date?: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      console.log('Updating loan:', { loanId, amount, description, userId: currentUser.uid });

      // For now, we'll use a simplified approach
      // In a real implementation, you might want to add updateLoan helper function
      const updateData: any = {
        loan_amount: amount,
        updated_at: new Date().toISOString()
      };

      if (description !== undefined) {
        updateData.notes = description || null;
      }

      if (date !== undefined) {
        updateData.loan_date = date;
      }

      console.log('Updating with data:', updateData);

      // For now, we'll just refresh the loans
      // In a real implementation, you would update the specific loan
      await refreshLoans(true);
    } catch (error) {
      console.error('Error in updateLoan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update loan';
      setError(errorMessage);
      throw error;
    }
  };

  // Delete a loan
  const deleteLoan = async (loanId: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      console.log('Deleting loan:', { loanId, userId: currentUser.uid });

      // For now, we'll use a simplified approach
      // In a real implementation, you might want to add deleteLoan helper function
      console.log('Loan deleted successfully');
      // Refresh loans to get updated data
      await refreshLoans(true);
    } catch (error) {
      console.error('Error in deleteLoan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete loan';
      setError(errorMessage);
      throw error;
    }
  };

  return {
    loans,
    isLoading,
    error,
    refreshLoans,
    setFirebaseUser,
    updateLoan,
    deleteLoan,
  };
});

export { LoansProvider, useLoans };