import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { LoansProvider, useLoans } from "@/contexts/LoansContext";
import { CustomersProvider, useCustomers } from "@/contexts/CustomersContext";
import { TransactionEntriesProvider, useTransactionEntries } from "@/contexts/TransactionEntriesContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { testFirebaseConnectionDetailed } from "@/lib/firebase";
import CustomSplashScreen from "@/components/SplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on network errors for iOS to prevent crashes
        if (Platform.OS === 'ios' && failureCount > 2) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Navigation flow control - optimized for smooth transitions
  useEffect(() => {
    if (isAuthenticated) {
      // After login flow - redirect to dashboard and prevent access to auth screens
      if (pathname.startsWith('/auth/')) {
        router.replace('/(tabs)/(home)/dashboard');
      }
    } else {
      // Before login flow - redirect to home and prevent access to private screens
      if (pathname.startsWith('/(tabs)/(home)/dashboard') || 
          pathname.startsWith('/(tabs)/(home)/customer') || 
          pathname.startsWith('/(tabs)/(home)/add-')) {
        // Use immediate navigation for smooth sign out transition
        router.replace('/(tabs)/(home)');
      }
    }
  }, [isAuthenticated, pathname, router]);

  // Handle hardware back button behavior
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pathname === '/auth/sign-in' || pathname === '/(tabs)/(home)') {
        // Exit app from login screen or home screen
        return false; // Let system handle (exit app)
      }
      
      if (pathname === '/auth/sign-up') {
        // Go back to sign-in from sign-up
        router.replace('/auth/sign-in');
        return true;
      }
      
      if (isAuthenticated) {
        // After login flow - prevent going back to auth screens
        if (pathname.startsWith('/(tabs)/(home)/dashboard')) {
          // From dashboard, exit app
          return false;
        }
        // For other authenticated screens, allow normal back navigation
        return false;
      } else {
        // Before login flow - normal back behavior
        return false;
      }
    });

    return () => backHandler.remove();
  }, [pathname, isAuthenticated, router]);

  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      gestureEnabled: true,
      animation: 'slide_from_right'
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="auth/sign-in" 
        options={{ 
          headerShown: false, 
          headerBackVisible: false,
          gestureEnabled: false // Disable swipe back from login
        }} 
      />
      <Stack.Screen 
        name="auth/sign-up" 
        options={{ 
          headerShown: false,
          gestureEnabled: true
        }} 
      />
      <Stack.Screen name="privacy-policy" options={{ presentation: 'modal' }} />
      <Stack.Screen name="terms-of-service" options={{ presentation: 'modal' }} />
      <Stack.Screen name="about" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

// Component to sync auth user with other contexts
function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser } = useAuth();
  
  // Always call hooks in the same order
  const loansContext = useLoans();
  const customersContext = useCustomers();
  const transactionEntriesContext = useTransactionEntries();

  React.useEffect(() => {
    // Sync the firebase user to all contexts
    try {
      if (loansContext && typeof loansContext.setFirebaseUser === 'function') {
        loansContext.setFirebaseUser(firebaseUser);
      }
      if (customersContext && typeof customersContext.setFirebaseUser === 'function') {
        customersContext.setFirebaseUser(firebaseUser);
      }
      if (transactionEntriesContext && typeof transactionEntriesContext.setFirebaseUser === 'function') {
        transactionEntriesContext.setFirebaseUser(firebaseUser);
      }
    } catch (error) {
      console.error('Error syncing firebase user to contexts:', error);
    }
  }, [firebaseUser, loansContext, customersContext, transactionEntriesContext]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // iOS-specific initialization delay to prevent crashes
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Test Firebase connection with shorter timeout and don't block app loading
        Promise.race([
          testFirebaseConnectionDetailed(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection test timeout')), 3000)
          )
        ]).then((connectionResult: any) => {
          if (!connectionResult.success) {
            console.warn('Firebase connection test failed:', connectionResult.error);
            console.warn('App may have limited functionality');
          } else {
            console.log('Firebase connection test successful');
          }
        }).catch((error) => {
          console.warn('Firebase connection test timed out or failed:', error);
          console.warn('App will continue with limited functionality');
        });
        
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        // Always set app as ready regardless of Firebase connection
        setIsAppReady(true);
        SplashScreen.hideAsync();
      }
    };

    // Add timeout to ensure app loads even if initialization fails
    const initTimeout = setTimeout(() => {
      console.warn('App initialization timeout, forcing app to load');
      setIsAppReady(true);
      SplashScreen.hideAsync();
    }, 5000);

    initializeApp().finally(() => {
      clearTimeout(initTimeout);
    });
  }, []);

  const handleSplashFinish = () => {
    setShowCustomSplash(false);
  };

  if (!isAppReady || showCustomSplash) {
    return <CustomSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusBar 
          style="light" 
          backgroundColor={Platform.OS === 'android' ? 'transparent' : "#3B82F6"}
          translucent={Platform.OS === 'android'}
        />
                        <ThemeProvider>
                  <LanguageProvider>
                    <NetworkProvider>
                      <AuthProvider>
                        <UserProfileProvider>
                          <LoansProvider>
                            <CustomersProvider>
                              <TransactionEntriesProvider>
                                <UserSyncProvider>
                                  <GestureHandlerRootView style={{ flex: 1 }}>
                                    <RootLayoutNav />
                                  </GestureHandlerRootView>
                                </UserSyncProvider>
                              </TransactionEntriesProvider>
                            </CustomersProvider>
                          </LoansProvider>
                        </UserProfileProvider>
                      </AuthProvider>
                    </NetworkProvider>
                  </LanguageProvider>
                </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}