import { Tabs, router, usePathname } from "expo-router";
import { Calculator, Settings, BarChart3, ArrowLeft, Home } from "lucide-react-native";
import React, { useRef } from "react";
import { BackHandler, Platform, TouchableOpacity } from "react-native";
import * as Haptics from 'expo-haptics';
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const lastPressTime = useRef(0);
  const isProcessingPress = useRef(false);
  
  // Debug: Log the current pathname
  console.log('🏠 TabLayout - Current pathname:', pathname, 'isAuthenticated:', isAuthenticated);
  
  // Check if we're on a home page for debugging
  const isCurrentlyOnHomePage = pathname === '/(tabs)/(home)/dashboard' || 
                               pathname === '/(tabs)/(home)' ||
                               pathname === '/(tabs)/(home)/index' ||
                               pathname.includes('/(tabs)/(home)/') ||
                               pathname.includes('/dashboard') ||
                               pathname.includes('/home');
  console.log('🏠 Is currently on home page:', isCurrentlyOnHomePage);
  
  // Simple logic:
  // - Public flow (not authenticated): ALWAYS show Calculator icon, NEVER show back button
  // - Private flow (authenticated): ALWAYS show Home icon, NEVER show back button
  const shouldShowBackButton = false; // Never show back button in either flow
  
  // Debug: Log the computed values
  console.log('shouldShowBackButton:', shouldShowBackButton, 'isAuthenticated:', isAuthenticated);
  
  // Handle hardware back button for authenticated users
  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pathname === '/(tabs)/(home)/dashboard') {
        // From dashboard (main authenticated page), exit app
        return false;
      }
      
      // For authenticated users, prevent going back to public flow
      // Always navigate to dashboard instead of allowing back navigation
      // This ensures users can never go back to calculator/public flow
      router.replace('/(tabs)/(home)/dashboard');
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [pathname, isAuthenticated]);

  // Use blue background in light mode, matching color in dark mode
  const tabBarBackgroundColor = isDark ? '#1E3A8A' : '#3B82F6';
  const tabBarBorderColor = isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.5)';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: tabBarBackgroundColor,
          borderTopColor: tabBarBorderColor,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t('home'),
          tabBarLabel: t('home'),
          tabBarIcon: ({ color }) => {
            // Check if we're already on home pages - SAME ROBUST CHECK AS TABPRESS
            const isOnHomePage = pathname === '/(tabs)/(home)/dashboard' || 
                                pathname === '/(tabs)/(home)' ||
                                pathname === '/(tabs)/(home)/index' ||
                                pathname.includes('/(tabs)/(home)/') ||
                                pathname.includes('/dashboard') ||
                                pathname.includes('/home');
            
            // Gray out icon when disabled, white when active
            const iconColor = isOnHomePage ? "#666666" : "#FFFFFF"; // Darker gray when disabled
            
            if (isAuthenticated) {
              return <Home color={iconColor} strokeWidth={2.5} />;
            }
            return <Calculator color={iconColor} strokeWidth={2.5} />;
          },
          headerShown: false,
          headerTitle: 'Home',
          headerTitleStyle: {
            fontWeight: 'bold',
          },

        }}
        listeners={{
          tabPress: (e) => {
            // ALWAYS prevent default
            e.preventDefault();
            
            // Check if we're already on home pages - MORE ROBUST CHECK
            const isOnHomePage = pathname === '/(tabs)/(home)/dashboard' || 
                                pathname === '/(tabs)/(home)' ||
                                pathname === '/(tabs)/(home)/index' ||
                                pathname.includes('/(tabs)/(home)/') ||
                                pathname.includes('/dashboard') ||
                                pathname.includes('/home');
            
            // If already on home page, do ABSOLUTELY NOTHING but maybe refresh data
            if (isOnHomePage) {
              console.log('🚫 HOME BUTTON DISABLED - Already at home area:', pathname);
              console.log('🚫 Preventing all navigation and haptics');
              
              // Optional: Trigger a silent data refresh when user tries to click Home while at home
              // This might help with the data loading issue
              if (pathname.includes('dashboard')) {
                console.log('🔄 Triggering silent data refresh for dashboard');
                // Set a flag that dashboard can detect to refresh data
                (globalThis as any).__forceHomeRefresh = Date.now();
              }
              
              return; // Complete early exit - no navigation, no haptics
            }
            
            // Only proceed if NOT on home page
            console.log('✅ Home button functional - navigating from:', pathname);
            
            // Add haptic feedback only if button is actually functional
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            
            // Handle authenticated vs non-authenticated navigation
            if (isAuthenticated) {
              console.log('🏠 Navigating directly to dashboard (bypass index.tsx)');
              router.replace('/(tabs)/(home)/dashboard');
            } else {
              console.log('🏠 Navigating to public home');
              router.push('/(tabs)/(home)');
            }
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color }) => <Settings color="#FFFFFF" strokeWidth={2.5} />,
          headerShown: false,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
        listeners={{
          tabPress: (e) => {
            // Add haptic feedback
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        }}
      />
    </Tabs>
  );
}