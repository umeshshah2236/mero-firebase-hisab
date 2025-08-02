import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, RefreshControl, TextInput, SafeAreaView, Animated, Linking } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Plus, User, Users, Search, TrendingUp, TrendingDown, Clock, Phone, MessageCircle, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactionEntries, TransactionEntry } from '@/contexts/TransactionEntriesContext';
import { useCustomers } from '@/contexts/CustomersContext';

import { capitalizeFirstLetters, extractDisplayName } from '@/utils/string-utils';


const { width } = Dimensions.get('window');

type TabType = 'customers';

interface PersonSummary {
  name: string;
  totalAmount: number;
  netBalance: number;
  transactionCount: number;
  lastTransactionDate: string;
  status: 'active' | 'settled';
  transactions: TransactionEntry[];
}



const DashboardScreen = React.memo(function DashboardScreen() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const { user, firebaseUser, isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const insets = useSafeAreaInsets();
  const { loading: transactionLoading, error: transactionError, setFirebaseUser, getAllTransactionEntries } = useTransactionEntries();
  const { customers, loading: customersLoading, error: customersError, fetchCustomers, setFirebaseUser: setCustomersFirebaseUser } = useCustomers();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [transactionEntries, setTransactionEntries] = useState<TransactionEntry[]>([]);

  // Redirect to home if user is not authenticated - optimized for smooth transitions
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !hasRedirected) {
      console.log('Dashboard: User not authenticated, redirecting to home');
      setHasRedirected(true);
      setHasInitiallyLoaded(false); // Reset initial load state on logout
      // Use immediate navigation for smooth sign out transition
      router.replace('/(tabs)/(home)');
    } else if (!authLoading && isAuthenticated && hasRedirected) {
      // Reset redirect flag when user becomes authenticated again
      console.log('Dashboard: User authenticated, resetting redirect flag');
      setHasRedirected(false);
    }
  }, [isAuthenticated, authLoading, hasRedirected]);

  // Update both contexts with current user
  useEffect(() => {
    if (firebaseUser) {
      setFirebaseUser(firebaseUser);
      setCustomersFirebaseUser(firebaseUser);
    }
  }, [firebaseUser, setFirebaseUser, setCustomersFirebaseUser]);

  // Only refresh data on first load - no automatic refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && user && !hasInitiallyLoaded && !hasRedirected) {
        console.log('Dashboard: Loading data for authenticated user');
        handleRefresh().finally(() => {
          setHasInitiallyLoaded(true);
        });
      }
      // Removed automatic refresh on focus to prevent layout shifts
    }, [isAuthenticated, user, hasInitiallyLoaded, hasRedirected])
  );

  // Don't render anything if user is not authenticated or still loading auth
  if (authLoading || !isAuthenticated) {
    return null;
  }

  // Handle network connectivity issues
  const isNetworkError = (errorMessage: string) => {
    return errorMessage.includes('Failed to fetch') || 
           errorMessage.includes('Network connection failed') || 
           errorMessage.includes('TypeError: Failed to fetch') ||
           errorMessage.includes('Request timed out') ||
           errorMessage.includes('AbortError');
  };

  const handleAddCustomer = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Add a small delay for smoother transition
    setTimeout(() => {
      router.push('/(tabs)/(home)/add-customer');
    }, 100);
  };

  const handleRefresh = async (forceRefresh: boolean = false) => {
    // Only show refreshing state for pull-to-refresh, not background refreshes
    if (forceRefresh) {
      setRefreshing(true);
    }
    
    try {
      // Check if we need to refresh the session first
      if (transactionError && transactionError.includes('session has expired')) {
        const sessionRefreshResult = await refreshSession();
        if (!sessionRefreshResult.success) {
          return;
        }
      }
      
      // Always refresh data silently in background
      const [customersResult, transactionsResult] = await Promise.all([
        fetchCustomers(true),
        getAllTransactionEntries()
      ]);
      
      // Update transaction entries state
      setTransactionEntries(transactionsResult || []);
    } catch (error) {
      // Handle errors silently for background refreshes
    } finally {
      if (forceRefresh) {
        setRefreshing(false);
      }
    }
  };



  // Create customer summaries combining database customers with transaction data
  const getCustomerSummaries = (): PersonSummary[] => {
    const customerMap = new Map<string, PersonSummary>();
    
    // First, add all customers from database
    customers.forEach((customer) => {
      customerMap.set(customer.name, {
        name: customer.name,
        totalAmount: 0,
        netBalance: 0,
        transactionCount: 0,
        lastTransactionDate: customer.updated_at,
        status: 'settled' as const,
        transactions: []
      });
    });
    
    // Then, process all transaction entries for balance calculation
    transactionEntries.forEach((transaction: TransactionEntry) => {
      const existing = customerMap.get(transaction.customer_name);
      const balanceImpact = transaction.transaction_type === 'given'
        ? transaction.amount
        : -transaction.amount;
      if (existing) {
        existing.totalAmount += Math.abs(transaction.amount);
        existing.netBalance += balanceImpact;
        existing.transactionCount += 1;
        existing.transactions.push(transaction);
        const transactionUpdatedAt = transaction.updated_at || transaction.transaction_date;
        if (new Date(transactionUpdatedAt) > new Date(existing.lastTransactionDate)) {
          existing.lastTransactionDate = transactionUpdatedAt;
        }
        existing.status = existing.netBalance !== 0 ? 'active' : 'settled';
      } else {
        // Customer not in database but has transactions - add them
        customerMap.set(transaction.customer_name, {
          name: transaction.customer_name,
          totalAmount: Math.abs(transaction.amount),
          netBalance: balanceImpact,
          transactionCount: 1,
          lastTransactionDate: transaction.updated_at || transaction.transaction_date,
          status: balanceImpact !== 0 ? 'active' : 'settled',
          transactions: [transaction]
        });
      }
    });
    
    return Array.from(customerMap.values()).sort((a, b) => {
      // Sort by most recent transaction/update time first (most recent first)
      const dateA = new Date(a.lastTransactionDate);
      const dateB = new Date(b.lastTransactionDate);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime(); // Most recent first
      }
      
      // If dates are the same, sort by balance (active customers first)
      if (a.netBalance !== b.netBalance) {
        return b.netBalance - a.netBalance;
      }
      
      // Finally, sort by name as fallback
      const nameA = a.name && typeof a.name === 'string' ? a.name.trim() : '';
      const nameB = b.name && typeof b.name === 'string' ? b.name.trim() : '';
      
      // If names are empty, sort them to the end
      if (!nameA && !nameB) return 0;
      if (!nameA) return 1;
      if (!nameB) return -1;
      
      return nameA.localeCompare(nameB);
    });
  };

  // Filter function for search
  const filterPersons = (persons: PersonSummary[], query: string): PersonSummary[] => {
    if (!query.trim()) return persons;
    return persons.filter(person => 
      person.name.toLowerCase().includes(query.toLowerCase())
    );
  };



  const allCustomers = getCustomerSummaries();
  
  const filteredCustomers = filterPersons(allCustomers, searchQuery);

  const handlePersonPress = (person: PersonSummary) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Add a small delay for smoother transition
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/(home)/customer-detail',
        params: {
          customerName: person.name,
          customerPhone: person.name // Using name as phone for now
        }
      });
    }, 100);
  };



  // Calculate totals based on customer balances:
  // TO RECEIVE (Green) = sum of all positive balances (customers owe you)
  // TO GIVE (Red) = sum of all negative balances (you owe customers)
  let toReceive = 0;
  let toGive = 0;
  
  allCustomers.forEach((customer) => {
    if (customer.netBalance > 0) {
      toReceive += customer.netBalance;
    } else if (customer.netBalance < 0) {
      toGive += Math.abs(customer.netBalance);
    }
  });

  // Get initials for avatar
  const getInitials = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const PersonCard = ({ person }: { person: PersonSummary }) => {
    const isPositiveBalance = person.netBalance > 0;
    const balanceColor = isPositiveBalance ? '#10B981' : person.netBalance < 0 ? '#EF4444' : '#6B7280';
    const statusText = isPositiveBalance ? t('toReceive') : person.netBalance < 0 ? t('toGive') : t('allSettled');
    
    // Find the customer in the customers array to get phone number
    const customerData = customers.find(c => c.name === person.name);
    const hasPhoneNumber = customerData?.phone && customerData.phone.trim() !== '';
    
    // Get transparent background color based on balance status
    const getTransparentBackgroundColor = () => {
      if (isPositiveBalance) {
        return isDark ? 'rgba(16, 185, 129, 0.02)' : 'rgba(16, 185, 129, 0.015)';
      } else if (person.netBalance < 0) {
        return isDark ? 'rgba(239, 68, 68, 0.02)' : 'rgba(239, 68, 68, 0.015)';
      }
      return isDark ? '#1F2937' : '#FFFFFF';
    };
    
    return (
      <TouchableOpacity
        style={[styles.premiumPersonCard, { 
          backgroundColor: getTransparentBackgroundColor(),
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
          shadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
        }]}
        onPress={() => handlePersonPress(person)}
        activeOpacity={Platform.OS === 'ios' ? 0.7 : 0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <LinearGradient
          colors={isDark 
            ? isPositiveBalance 
              ? ['rgba(16, 185, 129, 0.03)', 'rgba(16, 185, 129, 0.015)'] 
              : person.netBalance < 0 
                ? ['rgba(239, 68, 68, 0.03)', 'rgba(239, 68, 68, 0.015)']
                : ['rgba(31, 41, 55, 0.8)', 'rgba(17, 24, 39, 0.9)']
            : isPositiveBalance 
              ? ['rgba(16, 185, 129, 0.02)', 'rgba(16, 185, 129, 0.008)'] 
              : person.netBalance < 0 
                ? ['rgba(239, 68, 68, 0.02)', 'rgba(239, 68, 68, 0.008)']
                : ['rgba(255, 255, 255, 0.95)', 'rgba(249, 250, 251, 1)']
          }
          style={styles.cardGradientOverlay}
        >
          <View style={styles.premiumCardContent}>
            <View style={styles.cardMainRow}>
              <View style={styles.leftSection}>
                <View style={[styles.premiumAvatar, {
                  backgroundColor: isPositiveBalance ? '#10B981' : person.netBalance < 0 ? '#EF4444' : '#6366F1'
                }]}>
                  <Text style={styles.premiumInitials}>
                    {getInitials(person.name)}
                  </Text>
                </View>
                
                <View style={styles.customerInfo}>
                  <Text style={[styles.customerName, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                    {capitalizeFirstLetters(person.name)}
                  </Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.premiumStatusBadge, { 
                      backgroundColor: balanceColor + '15',
                      borderColor: balanceColor + '25'
                    }]}>
                      {isPositiveBalance ? (
                        <TrendingUp size={10} color={balanceColor} />
                      ) : person.netBalance < 0 ? (
                        <TrendingDown size={10} color={balanceColor} />
                      ) : (
                        <Clock size={10} color={balanceColor} />
                      )}
                      <Text style={[styles.premiumStatusText, { color: balanceColor }]}>
                        {statusText}
                      </Text>
                    </View>

                  </View>
                </View>
              </View>
              
              <View style={styles.rightSection}>
                <Text style={[styles.premiumAmountText, { color: balanceColor }]}>
                  रु{' '}{Math.abs(person.netBalance).toLocaleString('en-IN')}
                </Text>
                <TouchableOpacity 
                  style={[styles.premiumCallButton, {
                    backgroundColor: hasPhoneNumber 
                      ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
                      : (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)'),
                    borderColor: hasPhoneNumber 
                      ? (isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)')
                      : (isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)')
                  }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    
                    if (hasPhoneNumber) {
                      // Make actual phone call directly
                      const phoneNumber = customerData?.phone;
                      if (phoneNumber) {
                        try {
                          // Open phone dialer directly
                          const cleanPhone = phoneNumber.replace(/[^+\d]/g, '');
                          const phoneUrl = `tel:${cleanPhone}`;

                          Linking.openURL(phoneUrl).catch((err) => {
                            Alert.alert('Error', 'Could not open phone dialer');
                          });
                        } catch (error) {
                          Alert.alert('Error', 'Could not make phone call');
                        }
                      }
                    } else {
                      // Navigate to customer form to add phone number
                      router.push({
                        pathname: '/(tabs)/(home)/customer-form',
                        params: {
                          editMode: 'true',
                          customerId: customerData?.id || '',
                          customerName: person.name,
                          customerPhone: customerData?.phone || '',
                          focusPhone: 'true' // Indicate that we want to focus on phone field
                        }
                      });
                    }
                  }}
                  activeOpacity={Platform.OS === 'ios' ? 0.6 : 0.7}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  {hasPhoneNumber ? (
                    <>
                      <Phone size={14} color="#3B82F6" />
                      <Text style={[styles.premiumCallText, { color: '#3B82F6' }]}>{t('call')}</Text>
                    </>
                  ) : (
                    <>
                      <Phone size={14} color="#10B981" />
                      <Text style={[styles.premiumCallText, { color: '#10B981' }]}>{t('add')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };



  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false
        }} 
      />
      

      
      {/* Modern Finance Header */}
      <View style={[styles.modernFinanceHeader, { 
        paddingTop: Platform.OS === 'ios' ? insets.top + 16 : insets.top + 40, // Increased padding for Android camera area
        backgroundColor: '#1E293B',
        minHeight: 110 + insets.top,
        marginTop: Platform.OS === 'android' ? -insets.top : 0, // Negative margin to extend behind status bar on Android
      }]}>
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          style={styles.headerBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Modern Decorative Elements */}
        <View style={styles.modernDecorativeElement1} />
        <View style={styles.modernDecorativeElement2} />
        <View style={styles.modernDecorativeElement3} />
        
        {/* Header Content */}
        <View style={styles.modernHeaderContent}>
          {/* Left Side - User Profile with Finance Icon */}
          <View style={styles.modernProfileSection}>
            <View style={styles.modernAvatarContainer}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.modernAvatarGradient}
              >
                <Text style={styles.modernAvatarText}>
                  {getInitials(extractDisplayName(firebaseUser?.displayName || user?.name || user?.phone || ''))}
                </Text>
              </LinearGradient>
              <View style={styles.financeIconBadge}>
                <TrendingUp size={12} color="#10B981" />
              </View>
            </View>
            
            <View style={styles.modernProfileInfo}>
              <Text style={styles.modernGreetingText}>{t('welcomeBack')}</Text>
              <Text style={styles.modernProfileName}>
                {extractDisplayName(firebaseUser?.displayName || user?.name || user?.phone || '')}
              </Text>
            </View>
          </View>
          
          {/* Right Side - Enhanced Balance Display */}
          <View style={styles.modernBalanceSection}>
            <View style={styles.balanceHeader}>
              <Text style={styles.modernBalanceLabel}>{t('netBalance')}</Text>
              <View style={styles.balanceIndicator}>
                {(toReceive - toGive) > 0 ? (
                  <TrendingUp size={16} color="#10B981" />
                ) : (toReceive - toGive) < 0 ? (
                  <TrendingDown size={16} color="#EF4444" />
                ) : (
                  <Clock size={16} color="#64748B" />
                )}
              </View>
            </View>
            <Text style={[styles.modernBalanceAmount, {
              color: (toReceive - toGive) > 0 ? '#10B981' : (toReceive - toGive) < 0 ? '#EF4444' : '#64748B'
            }]}>
              रु{' '}{Math.abs(toReceive - toGive).toLocaleString('en-IN')}
            </Text>
            <View style={styles.modernBalanceStatus}>
              <Text style={[styles.modernBalanceStatusText, {
                color: (toReceive - toGive) > 0 ? '#10B981' : (toReceive - toGive) < 0 ? '#EF4444' : '#64748B'
              }]}>
                {(toReceive - toGive) > 0 ? t('toReceive') : (toReceive - toGive) < 0 ? t('toGive') : t('allSettled')}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{allCustomers.length}</Text>
            <Text style={styles.quickStatLabel}>{t('customers')}</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{allCustomers.filter(c => c.status === 'active').length}</Text>
            <Text style={styles.quickStatLabel}>{t('active')}</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: '#10B981' }]}>रु{' '}{toReceive.toLocaleString('en-IN')}</Text>
            <Text style={styles.quickStatLabel}>{t('toReceive')}</Text>
          </View>
        </View>
      </View>
      
      <SafeAreaView style={[styles.content, { backgroundColor: theme.colors.background }]}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => handleRefresh(true)}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
        {/* Content moved to ScrollView */}
        <View style={styles.contentWrapper}>
        {/* Premium Summary Cards */}
        <View style={styles.premiumSummaryContainer}>
          <View style={styles.premiumSummaryGrid}>
            <LinearGradient
              colors={['#10B981', '#059669', '#047857']}
              style={[styles.premiumSummaryCard, styles.receiveCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryCardHeader}>
                <View style={styles.summaryIconContainer}>
                  <TrendingUp size={16} color="rgba(255, 255, 255, 0.9)" />
                </View>
                <Text style={styles.summaryCardTitle}>{t('toReceive')}</Text>
              </View>
              <Text style={styles.summaryCardAmount}>रु{' '}{toReceive.toLocaleString('en-IN')}</Text>
              <View style={styles.summaryCardFooter}>
                <Text style={styles.summaryCardSubtext}>{t('amountYoullReceive')}</Text>
              </View>
            </LinearGradient>
            
            <LinearGradient
              colors={['#EF4444', '#DC2626', '#B91C1C']}
              style={[styles.premiumSummaryCard, styles.giveCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryCardHeader}>
                <View style={styles.summaryIconContainer}>
                  <TrendingDown size={16} color="rgba(255, 255, 255, 0.9)" />
                </View>
                <Text style={styles.summaryCardTitle}>{t('toGive')}</Text>
              </View>
              <Text style={styles.summaryCardAmount}>रु{' '}{toGive.toLocaleString('en-IN')}</Text>
              <View style={styles.summaryCardFooter}>
                <Text style={styles.summaryCardSubtext}>{t('amountYouOwe')}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>



        {/* Tab Content */}
        <View style={styles.tabContent}>
          {/* Error Display */}
          {(transactionError || customersError) && (
            <View style={[styles.errorContainer, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Text style={[styles.errorText, { color: '#DC2626' }]}>
                {isNetworkError(transactionError || customersError || '') 
                  ? 'Network connection failed. Please check your internet connection and try again.'
                  : (transactionError || customersError)
                }
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: '#DC2626' }]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  handleRefresh(true); // Force refresh on retry
                }}
                activeOpacity={Platform.OS === 'ios' ? 0.6 : 0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.retryButtonText}>
                  {(transactionError || customersError || '').includes('session has expired') ? 'Sign In Again' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          )}





          {/* Premium Search and Add Section */}
          <View style={styles.premiumSearchSection}>
            <View style={styles.premiumSearchContainer}>
              <View style={[styles.premiumSearchInputContainer, { 
                backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                shadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.04)'
              }]}>
                <View style={[styles.searchIconContainer, {
                  backgroundColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(107, 114, 128, 0.08)'
                }]}>
                  <Search size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </View>
                <TextInput
                  style={[styles.premiumSearchInput, { color: isDark ? '#F9FAFB' : '#111827' }]}
                  placeholder={t('searchCustomers')}
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              
              <TouchableOpacity
                style={styles.premiumAddButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  handleAddCustomer();
                }}
                activeOpacity={Platform.OS === 'ios' ? 0.7 : 0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <LinearGradient
                  colors={['#6366F1', '#4F46E5', '#4338CA']}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.premiumAddButtonText}>{t('addCustomer')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Premium Customers List - Simplified without loading indicators */}
          <View style={styles.premiumListContainer}>
            <View style={styles.premiumContentContainer}>
              {!transactionError && !customersError && (
                <>
                  {filteredCustomers.length > 0 ? (
                    <View style={styles.premiumCardsContainer}>
                      {filteredCustomers.map((person, index) => (
                        <View key={person.name} style={styles.premiumCardWrapper}>
                          <PersonCard person={person} />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.premiumEmptyState}>
                      <LinearGradient
                        colors={isDark ? ['rgba(99, 102, 241, 0.1)', 'rgba(79, 70, 229, 0.05)'] : ['rgba(99, 102, 241, 0.08)', 'rgba(79, 70, 229, 0.04)']}
                        style={styles.premiumEmptyIconContainer}
                      >
                        <Users size={40} color="#6366F1" />
                      </LinearGradient>
                      <Text style={[styles.premiumEmptyTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                        {searchQuery.trim() ? t('noMatchesFound') : t('noCustomersYet')}
                      </Text>
                      <Text style={[styles.premiumEmptyDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {searchQuery.trim() 
                          ? `${t('noCustomersFoundMatching')} "${searchQuery}". ${t('tryDifferentSearchTerm')}`
                          : t('addFirstCustomerDesc')
                        }
                      </Text>
                      {!searchQuery.trim() && (
                        <TouchableOpacity
                          style={styles.premiumEmptyButton}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }
                            handleAddCustomer();
                          }}
                          activeOpacity={Platform.OS === 'ios' ? 0.7 : 0.8}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <LinearGradient
                            colors={['#6366F1', '#4F46E5']}
                            style={styles.emptyButtonGradient}
                          >
                            <Plus size={16} color="white" />
                            <Text style={styles.premiumEmptyButtonText}>{t('addFirstCustomer')}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
});

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  // Modern Finance Header Styles
  modernFinanceHeader: {
    position: 'relative',
    paddingHorizontal: Platform.OS === 'android' ? 16 : 20,
    paddingBottom: Platform.OS === 'android' ? 12 : 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modernDecorativeElement1: {
    position: 'absolute',
    top: -20,
    right: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  modernDecorativeElement2: {
    position: 'absolute',
    bottom: -10,
    left: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  modernDecorativeElement3: {
    position: 'absolute',
    top: '50%',
    right: '30%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
  },
  modernHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 16,
  },
  modernProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  modernAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernAvatarText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  financeIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernProfileInfo: {
    flex: 1,
  },
  modernGreetingText: {
    fontSize: Platform.OS === 'android' ? 13 : 15,
    color: '#94A3B8',
    fontWeight: '400' as const,
    marginBottom: 2,
  },
  modernProfileName: {
    fontSize: Platform.OS === 'android' ? 18 : 22,
    fontWeight: '600' as const,
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  modernBalanceSection: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modernBalanceLabel: {
    fontSize: Platform.OS === 'android' ? 12 : 14,
    color: '#94A3B8',
    fontWeight: '400' as const,
  },
  balanceIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernBalanceAmount: {
    fontSize: Platform.OS === 'android' ? 20 : 26,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  modernBalanceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modernBalanceStatusText: {
    fontSize: Platform.OS === 'android' ? 11 : 13,
    fontWeight: '500' as const,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: Platform.OS === 'android' ? 16 : 18,
    fontWeight: '600' as const,
    color: '#F8FAFC',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: Platform.OS === 'android' ? 11 : 13,
    color: '#94A3B8',
    fontWeight: '400' as const,
  },
  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 8,
  },
  contentWrapper: {
    flex: 1,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  summaryTabs: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryTab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryTabGreen: {
    backgroundColor: '#10B981',
  },
  summaryTabRed: {
    backgroundColor: '#EF4444',
  },
  summaryTabTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginBottom: 4,
  },
  summaryTabAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  searchSection: {
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    height: 48,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    height: 48,
    justifyContent: 'flex-start',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    textAlignVertical: 'center',
  },
  addCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 12,
    gap: 6,
    height: 48,
    minWidth: 140,
  },
  addCustomerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  remindButton: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  remindText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  singleTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  tabIcon: {
    // Icon styling handled by cloneElement
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },

  modernListContainer: {
    // Container for the modern list
  },
  listHeader: {
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  centeredListHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  centeredHeaderBackground: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  centeredListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
    textAlign: 'center',
  },
  centeredListSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 8,
  },
  cardWrapper: {
    // Wrapper for animation and spacing
  },
  modernPersonCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 0,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  modernAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  modernInitials: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  nameSection: {
    flex: 1,
  },
  modernPersonName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  modernAmountText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  lastTransactionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    flex: 1,
  },
  remindActionButton: {
    backgroundColor: '#3B82F615',
  },
  callActionButton: {
    backgroundColor: '#10B98115',
  },
  callButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#10B98115',
    gap: 4,
  },
  callButtonTextCompact: {
    fontSize: 12,
    fontWeight: '600',
  },
  callButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#3B82F615',
    gap: 3,
  },
  callButtonTextLarge: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Legacy styles for compatibility
  listContainer: {
    // Container for the list items
  },
  personCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personInitials: {
    fontSize: 16,
    fontWeight: '600',
  },
  personDetails: {
    flex: 1,
  },
  personSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  personAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
  },

  modernEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Legacy empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },

  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Customers Header Styles
  customersHeaderContainer: {
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  customersHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customersHeaderIcon: {
    // Icon styling handled by component
  },
  customersHeaderLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  customersHeaderCount: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },

  // Premium Styles
  premiumPersonCard: {
    borderRadius: 0,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: Platform.OS === 'android' ? 50 : 64,
  },
  cardGradientOverlay: {
    flex: 1,
    borderRadius: 0, // Remove border radius for full width
  },
  premiumCardContent: {
    paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
    paddingVertical: Platform.OS === 'android' ? 6 : 12,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumAvatar: {
    width: Platform.OS === 'android' ? 32 : 44,
    height: Platform.OS === 'android' ? 32 : 44,
    borderRadius: Platform.OS === 'android' ? 16 : 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Platform.OS === 'android' ? 8 : 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumInitials: {
    fontSize: Platform.OS === 'android' ? 12 : 16,
    fontWeight: '700' as const,
    color: 'white',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: Platform.OS === 'android' ? 15 : 18,
    fontWeight: '500' as const,
    marginBottom: Platform.OS === 'android' ? 2 : 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  premiumStatusText: {
    fontSize: Platform.OS === 'android' ? 11 : 13,
    fontWeight: '500' as const,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  premiumAmountText: {
    fontSize: Platform.OS === 'android' ? 16 : 20,
    fontWeight: '600' as const,
    marginBottom: Platform.OS === 'android' ? 3 : 6,
  },
  premiumCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 6 : 10,
    paddingVertical: Platform.OS === 'android' ? 3 : 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: Platform.OS === 'android' ? 2 : 4,
  },
  premiumCallText: {
    fontSize: Platform.OS === 'android' ? 12 : 14,
    fontWeight: '500' as const,
    color: '#3B82F6',
  },

  // Premium Summary Styles
  premiumSummaryContainer: {
    paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
    marginTop: Platform.OS === 'android' ? 4 : 6,
    marginBottom: Platform.OS === 'android' ? 8 : 12,
  },
  premiumSummaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  premiumSummaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  receiveCard: {
    // Specific styles for receive card if needed
  },
  giveCard: {
    // Specific styles for give card if needed
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 6,
  },
  summaryCardTitle: {
    fontSize: Platform.OS === 'android' ? 12 : 13,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  summaryCardAmount: {
    fontSize: Platform.OS === 'android' ? 18 : 22,
    fontWeight: '700' as const,
    color: 'white',
    marginBottom: 3,
  },
  summaryCardFooter: {
    // Footer container
  },
  summaryCardSubtext: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400' as const,
  },

  // Premium Customers Header
  premiumCustomersHeader: {
    marginBottom: 12,
  },
  customersHeaderGradient: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  customersHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customersHeaderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customersHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  customersHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  customersCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  customersCountText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },

  // Premium Search Styles
  premiumSearchSection: {
    marginBottom: Platform.OS === 'android' ? 8 : 12,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
  },
  premiumSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumSearchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  premiumSearchInput: {
    flex: 1,
    fontSize: Platform.OS === 'android' ? 16 : 18,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  premiumAddButton: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  premiumAddButtonText: {
    fontSize: Platform.OS === 'android' ? 14 : 16,
    fontWeight: '500' as const,
    color: '#FFFFFF',
  },

  // Premium List Styles - Simplified
  premiumListContainer: {
    flex: 1,
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  premiumContentContainer: {
    flex: 1,
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  premiumCardsContainer: {
    gap: 0,
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  premiumCardWrapper: {
    // Wrapper for premium cards
  },

  // Premium Empty State
  premiumEmptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  premiumEmptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  premiumEmptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumEmptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  premiumEmptyButton: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  premiumEmptyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },

});