import { Tabs, router, usePathname } from "expo-router";
import { Calculator, Settings, BarChart3, ArrowLeft, Home } from "lucide-react-native";
import React, { useRef } from "react";
import { BackHandler, Platform, TouchableOpacity } from "react-native";
import * as Haptics from 'expo-haptics';
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export default React.memo(function TabLayout() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  
  // Memoize expensive calculations to prevent re-computation
  const isCurrentlyOnHomePage = React.useMemo(() => {
    return pathname === '/(tabs)/(home)/dashboard' || 
           pathname === '/(tabs)/(home)' ||
           pathname === '/(tabs)/(home)/index' ||
           pathname.includes('/(tabs)/(home)/') ||
           pathname.includes('/dashboard') ||
           pathname.includes('/home');
  }, [pathname]);
  
  // Memoize tab bar colors to prevent re-computation
  const tabBarColors = React.useMemo(() => ({
    backgroundColor: isDark ? '#1E3A8A' : '#3B82F6',
    borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.5)'
  }), [isDark]);
  
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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: tabBarColors.backgroundColor,
          borderTopColor: tabBarColors.borderColor,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        // CRITICAL: Android background to prevent white flash at all levels
        sceneContainerStyle: { backgroundColor: Platform.OS === 'android' ? '#0F172A' : 'transparent' },
        contentStyle: { backgroundColor: Platform.OS === 'android' ? '#0F172A' : 'transparent' },
        cardStyle: { backgroundColor: Platform.OS === 'android' ? '#0F172A' : 'transparent' },
        tabBarBackground: () => null, // Remove default background
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t('home'),
          tabBarLabel: t('home'),
          tabBarIcon: ({ color }) => {
            // Gray out icon when disabled, white when active
            const iconColor = isCurrentlyOnHomePage ? "#666666" : "#FFFFFF";
            
            if (isAuthenticated) {
              return <Home color={iconColor} strokeWidth={2.5} />;
            }
            return <Calculator color={iconColor} strokeWidth={2.5} />;
          },
          headerShown: false,
          headerTitle: 'Home',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }}
        listeners={{
          tabPress: (e) => {
            // ALWAYS prevent default
            e.preventDefault();
            
            // If already on home page, do nothing but trigger refresh
            if (isCurrentlyOnHomePage) {
              // Optional: Trigger a silent data refresh when user tries to click Home while at home
              if (pathname.includes('dashboard')) {
                (globalThis as any).__forceHomeRefresh = Date.now();
              }
              return; // Complete early exit - no navigation, no haptics
            }
            
            // Add haptic feedback only if button is actually functional
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            
            // Handle authenticated vs non-authenticated navigation
            if (isAuthenticated) {
              router.replace('/(tabs)/(home)/dashboard');
            } else {
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
          }
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
});