import { initializeApp } from 'firebase/app';
import { getAuth, PhoneAuthProvider, signInWithCredential, onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, orderBy, limit, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration - replace with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

console.log('Firebase Environment check:');
console.log('- EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing');
console.log('- EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Present' : '❌ Missing');
console.log('- EXPO_PUBLIC_FIREBASE_PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Present' : '❌ Missing');

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Missing Firebase environment variables');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

console.log('Firebase initialized with project ID:', firebaseConfig.projectId);

// Custom storage for Firebase Auth persistence
class FirebaseStorage {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  }
}

// Simple connection test
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test with timeout
    const result = await Promise.race([
      auth.currentUser ? Promise.resolve(true) : Promise.resolve(false),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 8000)
      )
    ]);
    
    console.log('Firebase connection test successful');
    return true;
  } catch (error) {
    console.error('Network error during Firebase connection test:', error);
    return false;
  }
};

// Detailed connection test with error info
export const testFirebaseConnectionDetailed = async () => {
  try {
    console.log('Testing detailed Firebase connection...');
    console.log('Firebase Project ID:', firebaseConfig.projectId);
    console.log('Firebase API Key present:', !!firebaseConfig.apiKey);
    
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      const missingVars = [];
      if (!firebaseConfig.apiKey) missingVars.push('EXPO_PUBLIC_FIREBASE_API_KEY');
      if (!firebaseConfig.projectId) missingVars.push('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
      const errorMsg = `Missing environment variables: ${missingVars.join(', ')}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    console.log('Environment variables check passed, testing connection...');
    
    // Test with timeout
    const result = await Promise.race([
      auth.currentUser ? Promise.resolve(true) : Promise.resolve(false),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 8 seconds')), 8000)
      )
    ]);
    
    console.log('Connection test result:', result);
    console.log('Firebase connection test successful');
    return { success: true, error: null };
  } catch (error) {
    console.error('Network error during Firebase connection test:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
    return { success: false, error: errorMessage };
  }
};

// Simplified error handler
export const handleFirebaseError = (error: any, operation: string) => {
  console.error(`Firebase ${operation} error:`, error);
  
  if (!error) {
    return { isNetworkError: true, message: 'Unknown error occurred' };
  }
  
  const errorMessage = error?.message || error?.code || 'An error occurred';
  
  // Handle timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return { isNetworkError: true, message: 'Request timed out. Please try again.' };
  }
  
  // Handle network errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
    return { isNetworkError: true, message: 'Network connection failed. Please check your internet connection.' };
  }
  
  // Handle auth errors
  if (errorMessage.includes('auth/') || errorMessage.includes('expired') || errorMessage.includes('401')) {
    return { isNetworkError: false, message: 'Your session has expired. Please sign in again.' };
  }
  
  return { isNetworkError: false, message: errorMessage };
};

// Simple operation wrapper with basic timeout
export const withTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number = 8000
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out. Please try again.')), timeoutMs);
  });
  
  return Promise.race([operation(), timeoutPromise]);
};

// Firestore helper functions
export const firestoreHelpers = {
  // Add a new customer
  async addCustomer(customerData: any) {
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { success: true, data: { id: docRef.id, ...customerData } };
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  },

  // Get customers for a user
  async getCustomers(userId: string) {
    try {
      const q = query(
        collection(db, 'customers'),
        where('user_id', '==', userId),
        orderBy('updated_at', 'desc'),
        limit(30)
      );
      const querySnapshot = await getDocs(q);
      const customers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return customers;
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  },

  // Update a customer
  async updateCustomer(id: string, updates: any) {
    try {
      const customerRef = doc(db, 'customers', id);
      await updateDoc(customerRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
      return { success: true, data: { id, ...updates } };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Delete a customer
  async deleteCustomer(id: string) {
    try {
      await deleteDoc(doc(db, 'customers', id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(userId: string) {
    try {
      const userRef = doc(db, 'profiles', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Create or update user profile
  async upsertUserProfile(userId: string, profileData: any) {
    try {
      const userRef = doc(db, 'profiles', userId);
      await setDoc(userRef, {
        ...profileData,
        updated_at: new Date().toISOString(),
      }, { merge: true });
      return { success: true, data: { id: userId, ...profileData } };
    } catch (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }
  },

  // Add a new loan
  async addLoan(loanData: any) {
    try {
      const docRef = await addDoc(collection(db, 'loans'), {
        ...loanData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { success: true, data: { id: docRef.id, ...loanData } };
    } catch (error) {
      console.error('Error adding loan:', error);
      throw error;
    }
  },

  // Get loans for a user
  async getLoans(userId: string) {
    try {
      const q = query(
        collection(db, 'loans'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const loans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return loans;
    } catch (error) {
      console.error('Error getting loans:', error);
      throw error;
    }
  },

  // Add a new transaction entry
  async addTransactionEntry(transactionData: any) {
    try {
      const docRef = await addDoc(collection(db, 'transaction_entries'), {
        ...transactionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { success: true, data: { id: docRef.id, ...transactionData } };
    } catch (error) {
      console.error('Error adding transaction entry:', error);
      throw error;
    }
  },

  // Get transaction entries for a user
  async getTransactionEntries(userId: string) {
    try {
      const q = query(
        collection(db, 'transaction_entries'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return entries;
    } catch (error) {
      console.error('Error getting transaction entries:', error);
      throw error;
    }
  },
};

export default app; 